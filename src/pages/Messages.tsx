import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Send, Search, Paperclip, FileText, X, Loader2, Users, Plus, UserPlus, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import { useMessages, useConversation } from '@/hooks/useMessages';
import { useGroupChats } from '@/hooks/useGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get('conversation');
  const isGroupChat = searchParams.get('type') === 'group';
  
  const { conversations, loading: conversationsLoading, getOrCreateConversation, refetch } = useMessages();
  const { groupChats, loading: groupChatsLoading, createGroupChat, leaveGroup, refetch: refetchGroups } = useGroupChats();
  const { messages, loading: messagesLoading, sendMessage, uploadAttachment } = useConversation(activeConversationId);
  
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !pendingAttachment) return;
    const success = await sendMessage(newMessage, pendingAttachment || undefined);
    if (success) {
      setNewMessage('');
      setPendingAttachment(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const attachment = await uploadAttachment(file);
    setIsUploading(false);

    if (attachment) {
      setPendingAttachment(attachment);
    } else {
      toast({
        title: 'Upload failed',
        description: 'Could not upload file. Please try again.',
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .neq('user_id', user.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(5);

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSearchMembers = async (query: string) => {
    setMemberSearchQuery(query);
    if (!query.trim() || !user) {
      setMemberSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .neq('user_id', user.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    // Filter out already selected members
    const filtered = data?.filter(p => !selectedMembers.some(m => m.user_id === p.user_id)) || [];
    setMemberSearchResults(filtered);
  };

  const addMemberToSelection = (profile: any) => {
    setSelectedMembers(prev => [...prev, profile]);
    setMemberSearchQuery('');
    setMemberSearchResults([]);
  };

  const removeMemberFromSelection = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.user_id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for your group',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: 'Add members',
        description: 'Please add at least one member to the group',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingGroup(true);
    const memberIds = selectedMembers.map(m => m.user_id);
    const conversationId = await createGroupChat(newGroupName, memberIds);

    if (conversationId) {
      setSearchParams({ conversation: conversationId, type: 'group' });
      setIsCreateGroupOpen(false);
      setNewGroupName('');
      setSelectedMembers([]);
      setActiveTab('groups');
      toast({
        title: 'Group created',
        description: `${newGroupName} has been created successfully`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Could not create group. Please try again.',
        variant: 'destructive',
      });
    }
    setIsCreatingGroup(false);
  };

  const startConversation = async (otherUserId: string) => {
    const conversationId = await getOrCreateConversation(otherUserId);
    if (conversationId) {
      setSearchParams({ conversation: conversationId });
      setSearchQuery('');
      setSearchResults([]);
      refetch();
    }
  };

  const selectGroupChat = (groupId: string) => {
    setSearchParams({ conversation: groupId, type: 'group' });
  };

  const handleLeaveGroup = async (groupId: string) => {
    const success = await leaveGroup(groupId);
    if (success) {
      setSearchParams({});
      toast({
        title: 'Left group',
        description: 'You have left the group chat',
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeGroupChat = groupChats.find(g => g.id === activeConversationId);

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground mb-6">Sign in to send and receive messages</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to feed</span>
            </Link>
          </motion.div>

          {/* Messages Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden h-[calc(100vh-180px)] flex"
          >
            {/* Conversations List */}
            <div className="w-80 border-r border-border flex flex-col">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'direct' | 'groups')} className="flex flex-col h-full">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Messages</h2>
                    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Group Chat</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Group Name</label>
                            <Input
                              placeholder="Enter group name..."
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Add Members</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Search users..."
                                value={memberSearchQuery}
                                onChange={(e) => handleSearchMembers(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            {memberSearchResults.length > 0 && (
                              <div className="mt-2 border border-border rounded-lg overflow-hidden bg-card max-h-40 overflow-y-auto">
                                {memberSearchResults.map((profile) => (
                                  <button
                                    key={profile.user_id}
                                    onClick={() => addMemberToSelection(profile)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-secondary/50 transition-colors text-left"
                                  >
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`} />
                                      <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{profile.display_name}</p>
                                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedMembers.length > 0 && (
                            <div>
                              <label className="text-sm font-medium mb-2 block">Selected Members ({selectedMembers.length})</label>
                              <div className="flex flex-wrap gap-2">
                                {selectedMembers.map((member) => (
                                  <div
                                    key={member.user_id}
                                    className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-full"
                                  >
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`} />
                                      <AvatarFallback>{member.display_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{member.display_name}</span>
                                    <button
                                      onClick={() => removeMemberFromSelection(member.user_id)}
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button
                            onClick={handleCreateGroup}
                            disabled={isCreatingGroup || !newGroupName.trim() || selectedMembers.length === 0}
                            className="w-full"
                          >
                            {isCreatingGroup ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Users className="w-4 h-4 mr-2" />
                                Create Group
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <TabsList className="w-full">
                    <TabsTrigger value="direct" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Direct
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      Groups
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="direct" className="flex-1 flex flex-col m-0 overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    {searchQuery && (
                      <div className="mt-2 border border-border rounded-lg overflow-hidden bg-card">
                        {isSearching ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((profile) => (
                            <button
                              key={profile.user_id}
                              onClick={() => startConversation(profile.user_id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                            >
                              <img
                                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`}
                                alt={profile.display_name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-sm">{profile.display_name}</p>
                                <p className="text-xs text-muted-foreground">@{profile.username}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {conversationsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-secondary" />
                            <div className="flex-1">
                              <div className="h-4 bg-secondary rounded w-24 mb-2" />
                              <div className="h-3 bg-secondary rounded w-32" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs mt-1">Search for users to start chatting</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSearchParams({ conversation: conv.id })}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left border-b border-border/50",
                            activeConversationId === conv.id && !isGroupChat && "bg-secondary/50"
                          )}
                        >
                          <div className="relative">
                            <img
                              src={conv.participant.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participant.user_id}`}
                              alt={conv.participant.display_name}
                              className="w-12 h-12 rounded-full"
                            />
                            {conv.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{conv.participant.display_name}</p>
                              {conv.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(conv.lastMessage.created_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="flex-1 flex flex-col m-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    {groupChatsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-secondary" />
                            <div className="flex-1">
                              <div className="h-4 bg-secondary rounded w-24 mb-2" />
                              <div className="h-3 bg-secondary rounded w-32" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : groupChats.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No group chats yet</p>
                        <p className="text-xs mt-1">Create a group to start chatting</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => setIsCreateGroupOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Group
                        </Button>
                      </div>
                    ) : (
                      groupChats.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => selectGroupChat(group.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left border-b border-border/50",
                            activeConversationId === group.id && isGroupChat && "bg-secondary/50"
                          )}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            {group.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                                {group.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{group.name}</p>
                              {group.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(group.lastMessage.created_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {group.lastMessage ? (
                                <>
                                  {group.lastMessage.sender?.display_name}: {group.lastMessage.content}
                                </>
                              ) : (
                                `${group.participants.length} members`
                              )}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {(activeConversation && !isGroupChat) || (activeGroupChat && isGroupChat) ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isGroupChat && activeGroupChat ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{activeGroupChat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activeGroupChat.participants.length} members
                            </p>
                          </div>
                        </>
                      ) : activeConversation ? (
                        <>
                          <Link to={`/profile/${activeConversation.participant.username}`}>
                            <img
                              src={activeConversation.participant.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConversation.participant.user_id}`}
                              alt={activeConversation.participant.display_name}
                              className="w-10 h-10 rounded-full hover:ring-2 hover:ring-primary transition-all"
                            />
                          </Link>
                          <div>
                            <Link 
                              to={`/profile/${activeConversation.participant.username}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {activeConversation.participant.display_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">@{activeConversation.participant.username}</p>
                          </div>
                        </>
                      ) : null}
                    </div>
                    {isGroupChat && activeGroupChat && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleLeaveGroup(activeGroupChat.id)}
                            className="text-destructive"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Leave Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-muted-foreground">Loading messages...</div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No messages yet. Say hello!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isOwn && isGroupChat && msg.sender && (
                              <Avatar className="w-8 h-8 mr-2 mt-1">
                                <AvatarImage src={msg.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`} />
                                <AvatarFallback>{msg.sender.display_name[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-secondary rounded-bl-md"
                              )}
                            >
                              {!isOwn && isGroupChat && msg.sender && (
                                <p className="text-xs font-medium mb-1 opacity-70">{msg.sender.display_name}</p>
                              )}
                              {msg.attachment_url && (
                                <div className="mb-2">
                                  {msg.attachment_type === 'image' ? (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={msg.attachment_url}
                                        alt={msg.attachment_name || 'Image'}
                                        className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={msg.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg",
                                        isOwn ? "bg-primary-foreground/10" : "bg-background/50"
                                      )}
                                    >
                                      <FileText className="w-4 h-4 flex-shrink-0" />
                                      <span className="text-sm truncate">{msg.attachment_name || 'File'}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              {msg.content && !msg.content.startsWith('Sent ') && (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              )}
                              <p className={cn(
                                "text-xs mt-1",
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    {pendingAttachment && (
                      <div className="mb-3 p-3 bg-secondary rounded-lg flex items-center gap-3">
                        {pendingAttachment.type === 'image' ? (
                          <img
                            src={pendingAttachment.url}
                            alt={pendingAttachment.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pendingAttachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pendingAttachment.type === 'image' ? 'Image' : 'File'} ready to send
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPendingAttachment(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-shrink-0"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4" />
                        )}
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() && !pendingAttachment}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm mt-1">Or search for a user to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
