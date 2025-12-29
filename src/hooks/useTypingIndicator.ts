import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  odUi: string;
  displayName: string;
  isTyping: boolean;
}

export const useTypingIndicator = (conversationId: string | null) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId || !user) {
      setTypingUsers([]);
      return;
    }

    const channelName = `typing:${conversationId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.odUi !== user.id && presence.isTyping) {
              users.push({
                odUi: presence.odUi,
                displayName: presence.displayName,
                isTyping: presence.isTyping,
              });
            }
          });
        });

        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            odUi: user.id,
            displayName: profile?.display_name || 'User',
            isTyping: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user, profile?.display_name]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.track({
      odUi: user.id,
      displayName: profile?.display_name || 'User',
      isTyping,
    });

    // Auto-stop typing after 3 seconds of no activity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            odUi: user.id,
            displayName: profile?.display_name || 'User',
            isTyping: false,
          });
        }
      }, 3000);
    }
  }, [user, profile?.display_name]);

  const typingText = typingUsers.length > 0
    ? typingUsers.length === 1
      ? `${typingUsers[0].displayName} is typing...`
      : `${typingUsers.length} people are typing...`
    : null;

  return {
    typingUsers,
    typingText,
    setTyping,
  };
};
