import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GroupConversation {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  creator_id: string | null;
  participants: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender?: {
      display_name: string;
      avatar_url: string | null;
    };
  };
  unreadCount: number;
}

export const useGroupChats = () => {
  const { user } = useAuth();
  const [groupChats, setGroupChats] = useState<GroupConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupChats = async () => {
    if (!user) {
      setGroupChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get all group conversation IDs the user is part of
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      setGroupChats([]);
      setLoading(false);
      return;
    }

    const conversationIds = participations.map(p => p.conversation_id);
    const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]));

    // Get group conversations only
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .eq('is_group', true)
      .order('updated_at', { ascending: false });

    if (!convData || convData.length === 0) {
      setGroupChats([]);
      setLoading(false);
      return;
    }

    // Get all participants for each group conversation
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convData.map(c => c.id));

    // Get unique user IDs
    const allUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', allUserIds);

    // Build group chats with details
    const groupChatsWithDetails: GroupConversation[] = await Promise.all(
      convData.map(async (conv) => {
        const convParticipants = allParticipants?.filter(p => p.conversation_id === conv.id) || [];
        const participants = convParticipants.map(p => {
          const profile = profiles?.find(pr => pr.user_id === p.user_id);
          return {
            user_id: p.user_id,
            display_name: profile?.display_name || 'Unknown',
            username: profile?.username || 'unknown',
            avatar_url: profile?.avatar_url || null,
          };
        });

        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];
        let senderProfile;
        if (lastMessage) {
          senderProfile = profiles?.find(p => p.user_id === lastMessage.sender_id);
        }

        // Count unread messages
        const lastReadAt = lastReadMap.get(conv.id);
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .gt('created_at', lastReadAt || '1970-01-01');

        return {
          id: conv.id,
          name: conv.name || 'Group Chat',
          avatar_url: conv.avatar_url,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          creator_id: conv.creator_id,
          participants,
          lastMessage: lastMessage ? {
            ...lastMessage,
            sender: senderProfile ? {
              display_name: senderProfile.display_name,
              avatar_url: senderProfile.avatar_url,
            } : undefined,
          } : undefined,
          unreadCount: unreadCount || 0,
        };
      })
    );

    setGroupChats(groupChatsWithDetails);
    setLoading(false);
  };

  const createGroupChat = async (name: string, memberIds: string[]): Promise<string | null> => {
    if (!user) return null;

    // Create group conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        is_group: true,
        name,
        creator_id: user.id,
      })
      .select()
      .single();

    if (convError || !newConv) {
      console.error('Error creating group conversation:', convError);
      return null;
    }

    // Add all participants including creator
    const allMembers = [...new Set([user.id, ...memberIds])];
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(allMembers.map(userId => ({
        conversation_id: newConv.id,
        user_id: userId,
      })));

    if (partError) {
      console.error('Error adding participants:', partError);
      return null;
    }

    await fetchGroupChats();
    return newConv.id;
  };

  const updateGroupChat = async (conversationId: string, updates: { name?: string; avatar_url?: string }) => {
    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating group:', error);
      return false;
    }

    await fetchGroupChats();
    return true;
  };

  const addMember = async (conversationId: string, userId: string) => {
    const { error } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
      });

    if (error) {
      console.error('Error adding member:', error);
      return false;
    }

    await fetchGroupChats();
    return true;
  };

  const removeMember = async (conversationId: string, userId: string) => {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      return false;
    }

    await fetchGroupChats();
    return true;
  };

  const leaveGroup = async (conversationId: string) => {
    if (!user) return false;
    return removeMember(conversationId, user.id);
  };

  useEffect(() => {
    fetchGroupChats();
  }, [user]);

  return {
    groupChats,
    loading,
    createGroupChat,
    updateGroupChat,
    addMember,
    removeMember,
    leaveGroup,
    refetch: fetchGroupChats,
  };
};
