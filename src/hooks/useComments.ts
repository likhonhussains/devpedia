import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useComments = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for this post's comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!commentsData?.length) return [];

      // Fetch profiles for comment authors
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, username')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      return commentsData.map(comment => ({
        ...comment,
        profile: profilesMap.get(comment.user_id),
      }));
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in to comment');
      if (!content.trim()) throw new Error('Comment cannot be empty');

      const { error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content: content.trim() });

      if (error) throw error;

      // Increment comments count
      await supabase.rpc('increment_post_comments', { p_post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Decrement comments count
      await supabase.rpc('decrement_post_comments', { p_post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    comments: comments || [],
    isLoading,
    addComment: (content: string) => addCommentMutation.mutate(content),
    deleteComment: (commentId: string) => deleteCommentMutation.mutate(commentId),
    isAddingComment: addCommentMutation.isPending,
  };
};
