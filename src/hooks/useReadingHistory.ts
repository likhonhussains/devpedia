import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReadingHistoryItem {
  id: string;
  post_id: string;
  read_at: string;
  post: {
    id: string;
    title: string;
    content: string;
    type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    tags: string[] | null;
    video_url: string | null;
    user_id: string;
    category: string | null;
    updated_at: string;
    status: string;
    slug: string | null;
  };
  author: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    user_id: string;
  };
}

export const useReadingHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('reading_history')
      .select('id, post_id, read_at')
      .eq('user_id', user.id)
      .order('read_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      console.error('Error fetching reading history:', error);
      setLoading(false);
      return;
    }

    // Fetch posts and authors for each history item
    const postIds = data.map(h => h.post_id);
    
    if (postIds.length === 0) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);

    if (!posts) {
      setLoading(false);
      return;
    }

    // Get unique user IDs from posts
    const userIds = [...new Set(posts.map(p => p.user_id))];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    // Combine data
    const historyWithDetails: ReadingHistoryItem[] = data
      .map(h => {
        const post = posts.find(p => p.id === h.post_id);
        if (!post) return null;
        
        const author = profiles?.find(p => p.user_id === post.user_id);
        if (!author) return null;

        return {
          id: h.id,
          post_id: h.post_id,
          read_at: h.read_at,
          post: {
            ...post,
            tags: post.tags || null,
            video_url: post.video_url || null,
            category: post.category || null,
            slug: post.slug || null,
          },
          author,
        };
      })
      .filter((item): item is ReadingHistoryItem => item !== null);

    setHistory(historyWithDetails);
    setLoading(false);
  };

  const trackRead = async (postId: string) => {
    if (!user) return;

    // Upsert to update read_at if already exists
    await supabase
      .from('reading_history')
      .upsert(
        { user_id: user.id, post_id: postId, read_at: new Date().toISOString() },
        { onConflict: 'user_id,post_id' }
      );
  };

  const removeFromHistory = async (postId: string) => {
    if (!user) return;

    await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    setHistory(prev => prev.filter(h => h.post_id !== postId));
  };

  const clearHistory = async () => {
    if (!user) return;

    await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', user.id);

    setHistory([]);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return {
    history,
    loading,
    trackRead,
    removeFromHistory,
    clearHistory,
    refetch: fetchHistory,
  };
};
