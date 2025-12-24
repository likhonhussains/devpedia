import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, UserPlus, UserMinus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

const UserCard = ({ profile, currentUserId }: { profile: UserProfile; currentUserId?: string }) => {
  const { isFollowing, isCheckingFollow, toggleFollow, isLoading } = useFollow(profile.user_id);
  const isOwnProfile = currentUserId === profile.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
    >
      <Link to={`/profile/${profile.username}`}>
        <img
          src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`}
          alt={profile.display_name}
          className="w-14 h-14 rounded-full ring-2 ring-border hover:ring-primary/50 transition-all"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${profile.username}`}
          className="font-semibold hover:text-primary transition-colors block truncate"
        >
          {profile.display_name}
        </Link>
        <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{profile.bio}</p>
        )}
      </div>

      {currentUserId && !isOwnProfile && (
        <Button
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => toggleFollow(profile.user_id, isFollowing)}
          disabled={isLoading || isCheckingFollow}
        >
          {isFollowing ? (
            <>
              <UserMinus className="w-4 h-4" />
              <span className="hidden sm:inline">Unfollow</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Follow</span>
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
};

const UserSearch = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  // Fetch users based on search
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio')
        .order('display_name', { ascending: true })
        .limit(20);

      if (debouncedQuery.trim()) {
        // Search by username or display name
        query = query.or(
          `username.ilike.%${debouncedQuery}%,display_name.ilike.%${debouncedQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data as UserProfile[];
    },
  });

  // Fetch suggested users (people with most followers or recent activity)
  const { data: suggestedUsers = [], isLoading: isLoadingSuggested } = useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: async () => {
      // Get users that the current user is NOT following
      let query = supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio')
        .order('created_at', { ascending: false })
        .limit(10);

      if (user) {
        // Exclude current user
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching suggested users:', error);
        return [];
      }

      return data as UserProfile[];
    },
    enabled: !debouncedQuery.trim(),
  });

  const displayUsers = debouncedQuery.trim() ? users : suggestedUsers;
  const showLoading = debouncedQuery.trim() ? isLoading : isLoadingSuggested;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Find People</h1>
            <p className="text-muted-foreground">
              Search for users to follow and connect with
            </p>
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by username or display name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 text-base bg-card border-border/50"
              />
            </div>
          </motion.div>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 mb-4"
          >
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">
              {debouncedQuery.trim() ? 'Search Results' : 'Suggested Users'}
            </h2>
          </motion.div>

          {/* User List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            {showLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
                  >
                    <Skeleton className="w-14 h-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </>
            ) : displayUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {debouncedQuery.trim()
                    ? 'No users found matching your search'
                    : 'No users to suggest yet'}
                </p>
              </div>
            ) : (
              displayUsers.map((profile) => (
                <UserCard
                  key={profile.user_id}
                  profile={profile}
                  currentUserId={user?.id}
                />
              ))
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UserSearch;
