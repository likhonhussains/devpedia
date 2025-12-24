import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's activity data
    const [likesResult, historyResult, followsResult, postsResult] = await Promise.all([
      // User's liked posts
      supabase
        .from('likes')
        .select('post_id, posts(title, tags, category, type)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      // User's reading history
      supabase
        .from('reading_history')
        .select('post_id, posts(title, tags, category, type)')
        .eq('user_id', userId)
        .order('read_at', { ascending: false })
        .limit(20),
      // Users they follow
      supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId),
      // All available posts (for recommendations)
      supabase
        .from('posts')
        .select('id, title, tags, category, type, likes_count, user_id')
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    // Extract user interests
    const likedPosts = likesResult.data || [];
    const readPosts = historyResult.data || [];
    const followedUserIds = (followsResult.data || []).map(f => f.following_id);
    const availablePosts = postsResult.data || [];

    // Build user profile for AI
    const likedTags = likedPosts
      .flatMap((l: any) => l.posts?.tags || [])
      .filter(Boolean);
    const readTags = readPosts
      .flatMap((r: any) => r.posts?.tags || [])
      .filter(Boolean);
    const categories = [...new Set([
      ...likedPosts.map((l: any) => l.posts?.category).filter(Boolean),
      ...readPosts.map((r: any) => r.posts?.category).filter(Boolean),
    ])];
    const contentTypes = [...new Set([
      ...likedPosts.map((l: any) => l.posts?.type).filter(Boolean),
      ...readPosts.map((r: any) => r.posts?.type).filter(Boolean),
    ])];

    // Already seen post IDs
    const seenPostIds = new Set([
      ...likedPosts.map((l: any) => l.post_id),
      ...readPosts.map((r: any) => r.post_id),
    ]);

    // Filter out seen posts
    const unseenPosts = availablePosts.filter(p => !seenPostIds.has(p.id));

    if (unseenPosts.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare context for AI
    const userProfile = {
      likedTags: [...new Set(likedTags)].slice(0, 15),
      readTags: [...new Set(readTags)].slice(0, 15),
      preferredCategories: categories.slice(0, 5),
      preferredTypes: contentTypes,
      followedUserCount: followedUserIds.length,
    };

    const postsForAI = unseenPosts.slice(0, 50).map(p => ({
      id: p.id,
      title: p.title,
      tags: p.tags || [],
      category: p.category,
      type: p.type,
      likes: p.likes_count,
      fromFollowed: followedUserIds.includes(p.user_id),
    }));

    // Call Lovable AI for recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content recommendation engine. Based on the user's interests and available posts, recommend the best matching posts.
            
Return ONLY a JSON array of post IDs in order of relevance (most relevant first). Return between 5-15 post IDs.
Example: ["id1", "id2", "id3"]

Consider:
- Tag overlap with user interests
- Category preferences
- Content type preferences
- Posts from followed users get a boost
- Higher liked posts indicate quality`
          },
          {
            role: 'user',
            content: `User Profile:
${JSON.stringify(userProfile, null, 2)}

Available Posts:
${JSON.stringify(postsForAI, null, 2)}

Return the recommended post IDs as a JSON array.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        console.error('Payment required');
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';
    
    // Parse AI response
    let recommendedIds: string[] = [];
    try {
      // Extract JSON array from response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendedIds = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback: return posts sorted by likes from followed users first
      recommendedIds = unseenPosts
        .sort((a, b) => {
          const aFollowed = followedUserIds.includes(a.user_id) ? 1 : 0;
          const bFollowed = followedUserIds.includes(b.user_id) ? 1 : 0;
          if (aFollowed !== bFollowed) return bFollowed - aFollowed;
          return b.likes_count - a.likes_count;
        })
        .slice(0, 15)
        .map(p => p.id);
    }

    console.log('Recommended IDs:', recommendedIds);

    return new Response(JSON.stringify({ recommendations: recommendedIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
