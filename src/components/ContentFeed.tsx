import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ContentCard from './ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ContentFeedProps {
  activeTab: string;
}

const ContentFeed = ({ activeTab }: ContentFeedProps) => {
  const postType = activeTab === 'notes' ? 'note' : activeTab === 'videos' ? 'video' : 'post';

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', postType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          type,
          title,
          content,
          video_url,
          tags,
          likes_count,
          comments_count,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('type', postType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const content = posts?.map((post) => ({
    id: post.id,
    type: post.type as 'post' | 'note' | 'video',
    title: post.title,
    author: (post.profiles as any)?.display_name || 'Anonymous',
    authorAvatar: (post.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
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
