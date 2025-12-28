import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeft, 
  Users, 
  Lock, 
  Globe, 
  Loader2,
  Trash2,
  MessageSquare,
  Plus,
  UserPlus,
  Heart,
  User,
  Search,
  X,
  Shield,
  Crown,
  ChevronDown,
  Settings,
  ImagePlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import { useGroup, useGroups, GroupPost, GroupMember, Group } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostCardProps {
  post: GroupPost;
  canManageContent: boolean;
  isOwner: boolean;
  onDelete: (postId: string) => void;
  isDeleting: boolean;
}

const PostCard = ({ post, canManageContent, isOwner, onDelete, isDeleting }: PostCardProps) => {
  const canDelete = canManageContent || isOwner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl p-5"
    >
      <div className="flex items-start gap-3 mb-4">
        <Link to={`/profile/${post.author?.username || 'unknown'}`}>
          <Avatar className="w-10 h-10 border border-white/20">
            <AvatarImage 
              src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
              alt={post.author?.display_name || 'User'}
            />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            to={`/profile/${post.author?.username || 'unknown'}`}
            className="font-semibold text-sm hover:text-primary transition-colors"
          >
            {post.author?.display_name || 'Unknown User'}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(post.id)}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      <h3 className="font-bold text-lg mb-2">{post.title}</h3>
      <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap mb-4">
        {post.content}
      </p>

      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
          <span>{post.likes_count}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>{post.comments_count}</span>
        </button>
      </div>
    </motion.div>
  );
};

const CreatePostDialog = ({ groupId }: { groupId: string }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { createPost, isCreatingPost } = useGroup(groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    createPost(
      { title, content },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setContent('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share something with the group
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              className="bg-white/5 border-white/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-white/5 border-white/20 resize-none"
              rows={5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingPost || !title.trim() || !content.trim()}>
              {isCreatingPost ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface UserSearchResult {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

const InviteMemberDialog = ({ groupId, members }: { groupId: string; members: GroupMember[] }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { addMember, isAddingMember } = useGroup(groupId);

  const memberUserIds = new Set(members?.map(m => m.user_id) || []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      
      // Filter out existing members
      const filteredResults = (data || []).filter(
        user => !memberUserIds.has(user.user_id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = (userId: string) => {
    addMember(userId, {
      onSuccess: () => {
        setSearchResults(prev => prev.filter(u => u.user_id !== userId));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20">
          <UserPlus className="w-4 h-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Search for users by username or name to invite them
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username or name..."
              className="pl-10 bg-white/5 border-white/20"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <Avatar className="w-10 h-10 border border-white/20">
                    <AvatarImage 
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`}
                      alt={user.display_name}
                    />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleInvite(user.user_id)}
                    disabled={isAddingMember}
                  >
                    {isAddingMember ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground py-8">
                No users found
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Type at least 2 characters to search
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MembersSheet = ({ groupId, isAdmin, currentUserId }: { groupId: string; isAdmin: boolean; currentUserId?: string }) => {
  const { members, membersLoading, removeMember, isRemovingMember, updateMemberRole, isUpdatingRole } = useGroup(groupId);

  const handleRemove = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeMember(userId);
  };

  const handleRoleChange = (userId: string, role: 'admin' | 'moderator' | 'member') => {
    updateMemberRole({ userId, role });
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="w-3 h-3" />;
    if (role === 'moderator') return <Shield className="w-3 h-3" />;
    return null;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20">
          <Users className="w-4 h-4" />
          Members
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background/95 backdrop-blur-xl border-white/20">
        <SheetHeader>
          <SheetTitle>Group Members</SheetTitle>
          <SheetDescription>
            {members?.length || 0} members in this group
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : members && members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Link to={`/profile/${member.profile?.username || 'unknown'}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 border border-white/20">
                    <AvatarImage 
                      src={member.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`}
                      alt={member.profile?.display_name || 'User'}
                    />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.profile?.display_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{member.profile?.username || 'unknown'}
                    </p>
                  </div>
                </Link>
                
                {isAdmin && member.user_id !== currentUserId ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 px-2"
                        disabled={isUpdatingRole}
                      >
                        {isUpdatingRole ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            {getRoleIcon(member.role)}
                            <span className="text-xs capitalize">{member.role}</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-white/20">
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(member.user_id, 'admin')}
                        className="gap-2"
                      >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Admin</span>
                        {member.role === 'admin' && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(member.user_id, 'moderator')}
                        className="gap-2"
                      >
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>Moderator</span>
                        {member.role === 'moderator' && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(member.user_id, 'member')}
                        className="gap-2"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>Member</span>
                        {member.role === 'member' && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  member.role !== 'member' && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary capitalize flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                  )
                )}
                
                {isAdmin && member.user_id !== currentUserId && member.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRemove(e, member.user_id)}
                    disabled={isRemovingMember}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
                  >
                    {isRemovingMember ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No members yet</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Edit Group Dialog
const EditGroupDialog = ({ group, groupId }: { group: Group; groupId: string }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [privacy, setPrivacy] = useState<'public' | 'private'>(group.privacy);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(group.cover_url);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { updateGroup, isUpdatingGroup } = useGroup(groupId);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | undefined> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `cover-${groupId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('group-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error(`Failed to upload image: ${uploadError.message}`);
      return undefined;
    }

    const { data } = supabase.storage.from('group-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setUploading(true);
    let coverUrl: string | undefined = group.cover_url || undefined;

    try {
      if (coverFile) {
        coverUrl = await uploadImage(coverFile);
      }

      updateGroup(
        { name, description, privacy, coverUrl },
        {
          onSuccess: () => {
            setOpen(false);
          },
        }
      );
    } finally {
      setUploading(false);
    }
  };

  const isLoading = isUpdatingGroup || uploading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20">
          <Settings className="w-4 h-4" />
          Edit Group
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update your group settings and appearance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Group Cover Image</Label>
            <div 
              className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <div className="text-center">
                    <ImagePlus className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-sm">Add cover image</span>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Group Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-white/5 border-white/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your group about?"
              className="bg-white/5 border-white/20 resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Privacy</Label>
            <RadioGroup value={privacy} onValueChange={(v) => setPrivacy(v as 'public' | 'private')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="edit-public" />
                <Label htmlFor="edit-public" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  Public - Anyone can see and join
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="edit-private" />
                <Label htmlFor="edit-private" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="w-4 h-4" />
                  Private - Only members can see content
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    group, 
    groupLoading, 
    isMember, 
    isAdmin,
    canManageContent,
    posts, 
    postsLoading,
    members,
    deletePost,
    isDeletingPost
  } = useGroup(id || '');
  const { joinGroup, isJoining, leaveGroup, isLeaving } = useGroups();

  if (groupLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Group not found</h1>
            <p className="text-muted-foreground mb-8">
              The group you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/groups">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Groups
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-20 pb-20">
        {/* Cover & Header */}
        <div className="h-48 sm:h-64 bg-gradient-to-br from-primary/30 to-primary/10 relative">
          {group.cover_url && (
            <img 
              src={group.cover_url} 
              alt={group.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
          {/* Group Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <Link
                to="/groups"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Groups
              </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{group.name}</h1>
                  {group.privacy === 'private' ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/20 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/20 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-4">
                  {group.description || 'No description available'}
                </p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {group.members_count} members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    {group.posts_count} posts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <MembersSheet groupId={id!} isAdmin={isAdmin} currentUserId={user?.id} />
                {isAdmin && <InviteMemberDialog groupId={id!} members={members || []} />}
                {isAdmin && <EditGroupDialog group={group} groupId={id!} />}
                
                {user && (
                  isMember ? (
                    <>
                      <CreatePostDialog groupId={id!} />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => leaveGroup(id!)}
                        disabled={isLeaving}
                        className="bg-white/10 border-white/20"
                      >
                        {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Leave Group'}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => joinGroup(id!)}
                      disabled={isJoining}
                    >
                      {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Join Group
                    </Button>
                  )
                )}
              </div>
            </div>
          </motion.div>

          {/* Posts */}
          <Tabs defaultValue="posts">
            <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              {postsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post}
                      canManageContent={canManageContent}
                      isOwner={post.user_id === user?.id}
                      onDelete={deletePost}
                      isDeleting={isDeletingPost}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {isMember ? 'Be the first to post something!' : 'Join the group to create posts'}
                  </p>
                  {isMember && <CreatePostDialog groupId={id!} />}
                </div>
              )}
            </TabsContent>

            <TabsContent value="about">
              <div className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl p-6">
                <h3 className="font-bold mb-4">About this group</h3>
                <p className="text-foreground/80 mb-6">
                  {group.description || 'No description available'}
                </p>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span><strong>{group.members_count}</strong> members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    <span><strong>{group.posts_count}</strong> posts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {group.privacy === 'private' ? (
                      <>
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        <span>Private group - Only members can see content</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <span>Public group - Anyone can join</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;
