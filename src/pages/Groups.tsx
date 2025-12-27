import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Lock, 
  Globe, 
  Loader2,
  Search,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import { useGroups, Group } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';

const GroupCard = ({ group, isMember }: { group: Group; isMember?: boolean }) => {
  const { joinGroup, isJoining, leaveGroup, isLeaving } = useGroups();
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl overflow-hidden hover:border-primary/50 transition-all group"
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/10 relative">
        {group.cover_url && (
          <img 
            src={group.cover_url} 
            alt={group.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 right-3">
          {group.privacy === 'private' ? (
            <span className="px-2 py-1 text-xs rounded-full bg-black/50 text-white flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </span>
          ) : (
            <span className="px-2 py-1 text-xs rounded-full bg-black/50 text-white flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Public
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <Link to={`/groups/${group.id}`}>
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {group.name}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {group.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {group.members_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {group.posts_count}
            </span>
          </div>

          {user && (
            isMember ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => leaveGroup(group.id)}
                disabled={isLeaving}
                className="bg-white/10 border-white/20"
              >
                {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Leave'}
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={() => joinGroup(group.id)}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
              </Button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CreateGroupDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const { createGroup, isCreating } = useGroups();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createGroup(
      { name, description, privacy },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
          setPrivacy('public');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a community for people with shared interests
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-white/5 border-white/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  Public - Anyone can see and join
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
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
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Groups = () => {
  const { user } = useAuth();
  const { groups, groupsLoading, myGroups, myGroupsLoading } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');

  const myGroupIds = new Set(myGroups?.map(g => g.id) || []);

  const filteredGroups = groups?.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredMyGroups = myGroups?.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Groups</h1>
              <p className="text-muted-foreground">
                Join communities and connect with like-minded people
              </p>
            </div>
            {user && <CreateGroupDialog />}
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm"
              />
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue={user ? "my-groups" : "discover"} className="w-full">
            <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              {user && <TabsTrigger value="my-groups">My Groups</TabsTrigger>}
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>

            {user && (
              <TabsContent value="my-groups">
                {myGroupsLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredMyGroups.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMyGroups.map((group) => (
                      <GroupCard key={group.id} group={group} isMember />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Join some groups or create your own!
                    </p>
                    <CreateGroupDialog />
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="discover">
              {groupsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredGroups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group) => (
                    <GroupCard 
                      key={group.id} 
                      group={group} 
                      isMember={myGroupIds.has(group.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No groups found</h3>
                  <p className="text-muted-foreground">
                    Be the first to create a group!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Groups;
