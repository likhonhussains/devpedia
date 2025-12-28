import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useGroupPostLike = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isLiked, isLoading: checkingLike } = useQuery({
    queryKey: ['group-post-like', postId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('group_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('group_post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;

      await supabase.rpc('increment_group_post_likes', { p_post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-post-like', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    },
    onError: (error) => {
      console.error('Like error:', error);
      toast.error('Failed to like post');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('group_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.rpc('decrement_group_post_likes', { p_post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-post-like', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    },
    onError: (error) => {
      console.error('Unlike error:', error);
      toast.error('Failed to unlike post');
    },
  });

  const toggleLike = () => {
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return {
    isLiked: !!isLiked,
    checkingLike,
    toggleLike,
    isToggling: likeMutation.isPending || unlikeMutation.isPending,
  };
};

export const useGroupPostComments = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['group-post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch author profiles
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(comment => ({
        ...comment,
        author: profileMap.get(comment.user_id),
      })) as GroupComment[];
    },
    enabled: !!postId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('group_comments')
        .insert({ post_id: postId, user_id: user.id, content });

      if (error) throw error;

      await supabase.rpc('increment_group_post_comments', { p_post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('Comment added');
    },
    onError: (error) => {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('group_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await supabase.rpc('decrement_group_post_comments', { p_post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      console.error('Delete comment error:', error);
      toast.error('Failed to delete comment');
    },
  });

  return {
    comments: comments || [],
    commentsLoading,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};
