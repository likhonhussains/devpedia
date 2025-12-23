import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useLikePost = (postId: string, initialLiked: boolean = false) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(initialLiked);

  // Check if user has liked this post
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }

    const checkLike = async () => {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkLike();
  }, [user, postId]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to like');

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Decrement likes_count using the database function
        await supabase.rpc('decrement_post_likes', { post_id: postId });

        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        // Increment likes_count using the database function
        await supabase.rpc('increment_post_likes', { post_id: postId });

        return true;
      }
    },
    onSuccess: (liked) => {
      setIsLiked(liked);
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

  const toggleLike = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts',
      });
      return;
    }
    likeMutation.mutate();
  };

  return {
    isLiked,
    isLoading: likeMutation.isPending,
    toggleLike,
  };
};
