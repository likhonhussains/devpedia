import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ContentCard from './ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ContentFeedProps {
  activeTab: string;
}

const ContentFeed = ({ activeTab }: ContentFeedProps) => {
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
          // Invalidate all post queries to refetch
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', postType],
    queryFn: async () => {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('type', postType)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      if (!postsData?.length) return [];

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      return postsData.map(post => ({
        ...post,
        profile: profilesMap.get(post.user_id),
      }));
    },
  });

  const content = posts?.map((post) => ({
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
  })) || [];

  if (isLoading) {
    return (
      <div className="mt-8 max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-8 max-w-4xl mx-auto grid gap-6 md:grid-cols-2"
    >
      {content.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <ContentCard {...item} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ContentFeed;
