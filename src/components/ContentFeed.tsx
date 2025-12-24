import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { FileText, StickyNote, Video, PenLine, SearchX, Users, Sparkles, RefreshCw } from 'lucide-react';
import ContentCard from './ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { FeedMode } from './FeedToggle';
import { SortMode } from './SortToggle';
import { useToast } from '@/hooks/use-toast';

interface ContentFeedProps {
  activeTab: string;
  searchQuery?: string;
  category?: string;
  feedMode?: FeedMode;
  sortMode?: SortMode;
}

const ContentFeed = ({ activeTab, searchQuery = '', category = 'all', feedMode = 'all', sortMode = 'recent' }: ContentFeedProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const postType = activeTab === 'notes' ? 'note' : activeTab === 'videos' ? 'video' : 'post';

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch followed user IDs for following feed
  const { data: followedUserIds = [] } = useQuery({
    queryKey: ['followed-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching followed users:', error);
        return [];
      }

      return data.map((f) => f.following_id);
    },
    enabled: !!user && feedMode === 'following',
  });

  // Fetch AI recommendations
  const { data: recommendedIds = [], isLoading: isLoadingRecommendations, refetch: refetchRecommendations } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast({
              title: 'Rate limit reached',
              description: 'Please try again in a moment.',
              variant: 'destructive',
            });
            return [];
          }
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        return data.recommendations || [];
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }
    },
    enabled: !!user && feedMode === 'recommended',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', postType, category, feedMode, followedUserIds, sortMode, recommendedIds],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('type', postType)
        .eq('status', 'published');

      // Apply sorting (only for non-recommended feeds)
      if (feedMode !== 'recommended') {
        if (sortMode === 'popular') {
          query = query.order('likes_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Filter by followed users if in following mode
      if (feedMode === 'following' && followedUserIds.length > 0) {
        query = query.in('user_id', followedUserIds);
      } else if (feedMode === 'following' && followedUserIds.length === 0) {
        return [];
      }

      // Filter by recommended IDs
      if (feedMode === 'recommended' && recommendedIds.length > 0) {
        query = query.in('id', recommendedIds);
      } else if (feedMode === 'recommended' && recommendedIds.length === 0) {
        // Fallback to popular posts if no recommendations
        query = query.order('likes_count', { ascending: false }).limit(20);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;
      if (!postsData?.length) return [];

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      let result = postsData.map(post => ({
        ...post,
        profile: profilesMap.get(post.user_id),
      }));

      // Sort by recommended order
      if (feedMode === 'recommended' && recommendedIds.length > 0) {
        const orderMap = new Map<string, number>(recommendedIds.map((id: string, idx: number) => [id, idx]));
        result = result.sort((a, b) => {
          const aIdx = orderMap.get(a.id) ?? 999;
          const bIdx = orderMap.get(b.id) ?? 999;
          return aIdx - bIdx;
        });
      }

      return result;
    },
  });

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!posts || !searchQuery.trim()) return posts || [];
    
    const query = searchQuery.toLowerCase().trim();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      post.profile?.display_name?.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const content = filteredPosts.map((post) => ({
    id: post.id,
    type: post.type as 'post' | 'note' | 'video',
    title: post.title,
    author: post.profile?.display_name || 'Anonymous',
    authorAvatar: post.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
    content: post.content,
    likes: post.likes_count,
    comments: post.comments_count,
    timestamp: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
    tags: post.tags || [],
    thumbnail: post.video_url || undefined,
  }));

  const getEmptyStateContent = () => {
    switch (postType) {
      case 'note':
        return {
          icon: StickyNote,
          title: 'No notes yet',
          description: 'Quick notes are perfect for sharing tips, snippets, and bite-sized knowledge.',
        };
      case 'video':
        return {
          icon: Video,
          title: 'No videos yet',
          description: 'Share tutorials, walkthroughs, and video content with the community.',
        };
      default:
        return {
          icon: FileText,
          title: 'No posts yet',
          description: 'Be the first to share your knowledge with the developer community.',
        };
    }
  };

  if (isLoading || (feedMode === 'recommended' && isLoadingRecommendations)) {
    return (
      <div className="mt-8 max-w-4xl mx-auto">
        {feedMode === 'recommended' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-6 text-primary"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Generating personalized recommendations...</span>
          </motion.div>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // No results from search
  if (content.length === 0 && searchQuery.trim()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 max-w-md mx-auto text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No results found</h3>
        <p className="text-muted-foreground">
          No {postType}s matching "{searchQuery}" were found. Try a different search term.
        </p>
      </motion.div>
    );
  }

  // Empty state for following feed (no one followed)
  if (content.length === 0 && feedMode === 'following') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 max-w-md mx-auto text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No posts from people you follow</h3>
        <p className="text-muted-foreground mb-6">
          Start following people to see their posts in your feed.
        </p>
        <Button asChild size="lg">
          <Link to="/users">
            <Users className="w-4 h-4 mr-2" />
            Find people to follow
          </Link>
        </Button>
      </motion.div>
    );
  }

  // Empty state (no posts at all)
  if (content.length === 0) {
    const emptyState = getEmptyStateContent();
    const Icon = emptyState.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 max-w-md mx-auto text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{emptyState.title}</h3>
        <p className="text-muted-foreground mb-6">{emptyState.description}</p>
        <Button asChild size="lg">
          <Link to="/create">
            <PenLine className="w-4 h-4 mr-2" />
            Create the first {postType}
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-8 max-w-4xl mx-auto"
    >
      {feedMode === 'recommended' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Personalized for you</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchRecommendations()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {content.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <ContentCard {...item} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ContentFeed;
