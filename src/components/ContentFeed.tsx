import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { FileText, StickyNote, Video, PenLine, SearchX } from 'lucide-react';
import ContentCard from './ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ContentFeedProps {
  activeTab: string;
  searchQuery?: string;
  category?: string;
}

const ContentFeed = ({ activeTab, searchQuery = '', category = 'all' }: ContentFeedProps) => {
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

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', postType, category],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('type', postType)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
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

      return postsData.map(post => ({
        ...post,
        profile: profilesMap.get(post.user_id),
      }));
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

  if (isLoading) {
    return (
      <div className="mt-8 max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
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
      className="mt-8 max-w-4xl mx-auto grid gap-6 md:grid-cols-2"
    >
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
    </motion.div>
  );
};

export default ContentFeed;
