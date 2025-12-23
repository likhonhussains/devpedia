import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  sender?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participant: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  lastMessage?: Message;
  unreadCount: number;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get all conversation IDs the user is part of
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = participations.map(p => p.conversation_id);
    const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]));

    // Get conversations
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (!convData) {
      setLoading(false);
      return;
    }

    // Get other participants for each conversation
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds)
      .neq('user_id', user.id);

    // Get unique user IDs
    const otherUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', otherUserIds);

    // Get last message for each conversation
    const conversationsWithDetails: Conversation[] = await Promise.all(
      convData.map(async (conv) => {
        const otherParticipant = allParticipants?.find(p => p.conversation_id === conv.id);
        const profile = profiles?.find(p => p.user_id === otherParticipant?.user_id);

        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

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
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          participant: profile ? {
            user_id: profile.user_id,
            display_name: profile.display_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : {
            user_id: otherParticipant?.user_id || '',
            display_name: 'Unknown User',
            username: 'unknown',
            avatar_url: null,
          },
          lastMessage: messages?.[0],
          unreadCount: unreadCount || 0,
        };
      })
    );

    setConversations(conversationsWithDetails);
    setLoading(false);
  };

  const getOrCreateConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: myConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConversations) {
      for (const conv of myConversations) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (otherParticipant) {
          return conv.conversation_id;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError || !newConv) {
      console.error('Error creating conversation:', convError);
      return null;
    }

    // Add both participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

    if (partError) {
      console.error('Error adding participants:', partError);
      return null;
    }

    return newConv.id;
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return {
    conversations,
    loading,
    getOrCreateConversation,
    getTotalUnreadCount,
    refetch: fetchConversations,
  };
};

export const useConversation = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return;
    }

    // Get sender profiles
    const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', senderIds);

    const messagesWithSenders = data?.map(msg => ({
      ...msg,
      sender: profiles?.find(p => p.user_id === msg.sender_id) || undefined,
    })) || [];

    setMessages(messagesWithSenders);
    setLoading(false);

    // Mark as read
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  };

  const sendMessage = async (
    content: string, 
    attachment?: { url: string; type: string; name: string }
  ) => {
    if (!conversationId || !user) return false;
    if (!content.trim() && !attachment) return false;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || (attachment ? `Sent ${attachment.type === 'image' ? 'an image' : 'a file'}` : ''),
        attachment_url: attachment?.url || null,
        attachment_type: attachment?.type || null,
        attachment_name: attachment?.name || null,
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  };

  const uploadAttachment = async (file: File): Promise<{ url: string; type: string; name: string } | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(fileName);

    const isImage = file.type.startsWith('image/');
    
    return {
      url: publicUrl,
      type: isImage ? 'image' : 'file',
      name: file.name,
    };
  };

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .maybeSingle();

          setMessages(prev => [...prev, { ...newMessage, sender: profile || undefined }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [conversationId, user]);

  return {
    messages,
    loading,
    sendMessage,
    uploadAttachment,
    refetch: fetchMessages,
  };
};
