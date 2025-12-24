import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (targetUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if current user is following target user
  const { data: isFollowing = false, isLoading: isCheckingFollow } = useQuery({
    queryKey: ['following', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;

      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  // Follow a user
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Following',
        description: 'You are now following this user.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to follow user.',
        variant: 'destructive',
      });
    },
  });

  // Unfollow a user
  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Unfollowed',
        description: 'You have unfollowed this user.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unfollow user.',
        variant: 'destructive',
      });
    },
  });

  const toggleFollow = (userId: string, currentlyFollowing: boolean) => {
    if (currentlyFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  return {
    isFollowing,
    isCheckingFollow,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    toggleFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
};
