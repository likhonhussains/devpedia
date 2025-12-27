import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  avatar_url: string | null;
  privacy: 'public' | 'private';
  creator_id: string;
  members_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all public groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Group[];
    },
  });

  // Fetch user's groups
  const { data: myGroups, isLoading: myGroupsLoading } = useQuery({
    queryKey: ['myGroups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      if (memberError) throw memberError;
      
      const groupIds = memberData.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Group[];
    },
    enabled: !!user,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description, privacy }: { name: string; description?: string; privacy: 'public' | 'private' }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          privacy,
          creator_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Group created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create group: ' + error.message);
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });
      
      if (error) throw error;
      
      // Update members count
      await supabase.rpc('increment_group_members', { p_group_id: groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers'] });
      toast.success('Joined group successfully!');
    },
    onError: (error) => {
      toast.error('Failed to join group: ' + error.message);
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update members count
      await supabase.rpc('decrement_group_members', { p_group_id: groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers'] });
      toast.success('Left group successfully!');
    },
    onError: (error) => {
      toast.error('Failed to leave group: ' + error.message);
    },
  });

  return {
    groups,
    groupsLoading,
    myGroups,
    myGroupsLoading,
    createGroup: createGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    joinGroup: joinGroupMutation.mutate,
    isJoining: joinGroupMutation.isPending,
    leaveGroup: leaveGroupMutation.mutate,
    isLeaving: leaveGroupMutation.isPending,
  };
};

export const useGroup = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch single group
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      
      if (error) throw error;
      return data as Group;
    },
    enabled: !!groupId,
  });

  // Check if user is member
  const { data: membership } = useQuery({
    queryKey: ['groupMembership', groupId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as GroupMember | null;
    },
    enabled: !!groupId && !!user,
  });

  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: async () => {
      const { data: memberData, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profiles for members
      const userIds = memberData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return memberData.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id),
      })) as GroupMember[];
    },
    enabled: !!groupId,
  });

  // Fetch group posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['groupPosts', groupId],
    queryFn: async () => {
      const { data: postData, error } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles for post authors
      const userIds = [...new Set(postData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return postData.map(p => ({
        ...p,
        author: profileMap.get(p.user_id),
      })) as GroupPost[];
    },
    enabled: !!groupId,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          user_id: user.id,
          title,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update posts count
      await supabase.rpc('increment_group_posts', { p_group_id: groupId });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create post: ' + error.message);
    },
  });

  // Add member mutation (for admins)
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        });
      
      if (error) throw error;
      
      await supabase.rpc('increment_group_members', { p_group_id: groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Member added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add member: ' + error.message);
    },
  });

  return {
    group,
    groupLoading,
    membership,
    isMember: !!membership,
    isAdmin: membership?.role === 'admin',
    members,
    membersLoading,
    posts,
    postsLoading,
    createPost: createPostMutation.mutate,
    isCreatingPost: createPostMutation.isPending,
    addMember: addMemberMutation.mutate,
    isAddingMember: addMemberMutation.isPending,
  };
};
