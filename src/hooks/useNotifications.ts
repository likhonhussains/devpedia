import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  showBrowserNotification,
  formatNotificationContent,
  requestNotificationPermission,
  getNotificationPermission,
  isBrowserNotificationSupported,
} from '@/utils/browserNotifications';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'badge';
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  message_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  post?: {
    title: string;
  };
  latestBadge?: {
    name: string;
    description: string;
    icon: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications with actor and post info
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch actor profiles
      const actorIds = [...new Set(data.map(n => n.actor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', actorIds);

      // Fetch post titles
      const postIds = [...new Set(data.filter(n => n.post_id).map(n => n.post_id))];
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title')
        .in('id', postIds);

      // For badge notifications, fetch the latest badge for each user
      const badgeNotifications = data.filter(n => n.type === 'badge');
      let latestBadges: Record<string, any> = {};
      
      if (badgeNotifications.length > 0) {
        for (const bn of badgeNotifications) {
          const { data: userBadge } = await supabase
            .from('user_badges')
            .select(`
              earned_at,
              badges (
                name,
                description,
                icon
              )
            `)
            .eq('user_id', bn.user_id)
            .order('earned_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (userBadge) {
            latestBadges[bn.id] = userBadge.badges;
          }
        }
      }

      // Map notifications with actor, post, and badge info
      return data.map(notification => ({
        ...notification,
        actor: profiles?.find(p => p.user_id === notification.actor_id),
        post: posts?.find(p => p.id === notification.post_id),
        latestBadge: latestBadges[notification.id],
      })) as Notification[];
    },
    enabled: !!user,
  });

  // Helper to show browser notification for a new notification
  const triggerBrowserNotification = useCallback(async (payload: any) => {
    if (getNotificationPermission() !== 'granted') return;

    // Fetch actor info
    const { data: actor } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', payload.new.actor_id)
      .single();

    // Fetch post info if applicable
    let postTitle: string | undefined;
    if (payload.new.post_id) {
      const { data: post } = await supabase
        .from('posts')
        .select('title')
        .eq('id', payload.new.post_id)
        .single();
      postTitle = post?.title;
    }

    const actorName = actor?.display_name || 'Someone';
    const { title, body } = formatNotificationContent(
      payload.new.type,
      actorName,
      postTitle
    );

    showBrowserNotification({
      title,
      body,
      icon: actor?.avatar_url || undefined,
      tag: payload.new.id,
      onClick: () => {
        // Focus will happen automatically, notification bell will show new items
      },
    });
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          // Trigger browser notification
          triggerBrowserNotification(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, triggerBrowserNotification]);

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Permission helpers
  const notificationPermission = getNotificationPermission();
  const canRequestPermission = isBrowserNotificationSupported() && notificationPermission === 'default';

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    // Browser notification helpers
    notificationPermission,
    canRequestPermission,
    requestPermission: requestNotificationPermission,
  };
};
