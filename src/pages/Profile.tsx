import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, UserPlus, Edit3, FileText, StickyNote, Video, PenSquare, MessageCircle, Camera, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import ContentCard from '@/components/ContentCard';
import FollowersModal from '@/components/FollowersModal';
import ProfileEditSheet from '@/components/ProfileEditSheet';
import BadgeDisplay from '@/components/BadgeDisplay';
import ProfileStats from '@/components/ProfileStats';
import ProfileCompletion from '@/components/ProfileCompletion';
import SocialLinks from '@/components/SocialLinks';
import RecentActivity from '@/components/RecentActivity';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  cover_url?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  tags: string[] | null;
  video_url: string | null;
  slug: string | null;
}

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile: currentUserProfile } = useAuth();
  const { getOrCreateConversation } = useMessages();
  
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user && profileData?.user_id === user.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);

      // If viewing own profile via /profile without username
      if (!username && currentUserProfile) {
        setProfileData(currentUserProfile as ProfileData);
        await fetchUserContent(currentUserProfile.user_id);
        await fetchFollowCounts(currentUserProfile.user_id);
        await fetchStats(currentUserProfile.user_id);
        setLoading(false);
        return;
      }

      // If no username and not logged in, redirect
      if (!username && !user) {
        navigate('/auth');
        return;
      }

      // Fetch profile by username
      if (username) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (error || !profile) {
          navigate('/');
          return;
        }

        setProfileData(profile);
        await fetchUserContent(profile.user_id);
        await fetchFollowCounts(profile.user_id);
        await fetchStats(profile.user_id);
        
        // Check if current user is following this profile
        if (user && user.id !== profile.user_id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profile.user_id)
            .maybeSingle();
          
          setIsFollowing(!!followData);
        }
      }

      setLoading(false);
    };

    const fetchUserContent = async (userId: string) => {
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setUserPosts(posts || []);
    };

    const fetchFollowCounts = async (userId: string) => {
      const { count: followers } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: following } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    };

    const fetchStats = async (userId: string) => {
      // Get total likes received
      const { data: posts } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('user_id', userId);
      
      const likes = posts?.reduce((sum, post) => sum + post.likes_count, 0) || 0;
      setTotalLikes(likes);

      // Get total comments made
      const { count: comments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      setTotalComments(comments || 0);
    };

    fetchProfileData();
  }, [username, user, currentUserProfile, navigate]);

  // Refresh profile data when edit sheet closes
  useEffect(() => {
    if (!editSheetOpen && currentUserProfile && isOwnProfile) {
      setProfileData(currentUserProfile as ProfileData);
    }
  }, [editSheetOpen, currentUserProfile, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !profileData) return;

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileData.user_id);
      
      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: user.id, following_id: profileData.user_id });
      
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }
  };

  const openFollowersModal = (type: 'followers' | 'following') => {
    setFollowersModalType(type);
    setFollowersModalOpen(true);
  };

  const tabs = [
    { id: 'posts', label: 'Posts', icon: FileText, count: userPosts.filter(p => p.type === 'post').length },
    { id: 'notes', label: 'Notes', icon: StickyNote, count: userPosts.filter(p => p.type === 'note').length },
    { id: 'videos', label: 'Videos', icon: Video, count: userPosts.filter(p => p.type === 'video').length },
  ];

  const getContent = () => {
    const typeMap: Record<string, string> = {
      posts: 'post',
      notes: 'note',
      videos: 'video',
    };
    return userPosts.filter(p => p.type === typeMap[activeTab]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <main className="relative z-10 pt-6 pb-20 px-4 sm:px-6">
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

          {/* Cover Photo & Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden mb-6"
          >
            {/* Cover Photo */}
            <div className="relative h-32 sm:h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20">
              {profileData.cover_url ? (
                <img
                  src={profileData.cover_url}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/30" />
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setEditSheetOpen(true)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="px-4 sm:px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="-mt-12 sm:-mt-16 z-10"
                >
                  <div className="relative">
                    <img
                      src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.user_id}`}
                      alt={profileData.display_name}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-card object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                </motion.div>

                {/* Info */}
                <div className="flex-1 pt-2 sm:pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">{profileData.display_name}</h1>
                      <p className="text-muted-foreground font-mono text-sm">@{profileData.username}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {isOwnProfile ? (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditSheetOpen(true)}>
                          <Edit3 className="w-4 h-4" />
                          Edit Profile
                        </Button>
                      ) : user ? (
                        <>
                          <Button
                            variant={isFollowing ? 'outline' : 'default'}
                            size="sm"
                            className="gap-2"
                            onClick={handleFollow}
                          >
                            <UserPlus className="w-4 h-4" />
                            {isFollowing ? 'Following' : 'Follow'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={async () => {
                              const conversationId = await getOrCreateConversation(profileData.user_id);
                              if (!conversationId) {
                                toast({
                                  title: 'Messaging not available',
                                  description: 'Please sign in again and try sending a message.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              navigate(`/messages?conversation=${conversationId}`);
                            }}
                          >
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Bio */}
                  {profileData.bio ? (
                    <p className="mt-3 text-foreground/90 leading-relaxed">{profileData.bio}</p>
                  ) : isOwnProfile ? (
                    <p className="mt-3 text-muted-foreground italic">Add a bio to tell people about yourself</p>
                  ) : null}

                  {/* Meta & Social */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                    {profileData.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {profileData.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(profileData.created_at)}
                    </span>
                  </div>

                  {/* Social Links */}
                  <div className="mt-4">
                    <SocialLinks
                      website={profileData.website}
                      twitter={profileData.twitter}
                      github={profileData.github}
                      linkedin={profileData.linkedin}
                    />
                  </div>

                  {/* Badges */}
                  <div className="mt-3 sm:mt-4">
                    <BadgeDisplay userId={profileData.user_id} />
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 sm:gap-6 mt-3 sm:mt-4">
                    <button 
                      onClick={() => openFollowersModal('followers')}
                      className="group flex items-center gap-1.5 sm:gap-2 hover:text-primary transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
                      <span className="font-semibold text-sm sm:text-base">{followersCount.toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs sm:text-sm">followers</span>
                    </button>
                    <button 
                      onClick={() => openFollowersModal('following')}
                      className="group flex items-center gap-1.5 sm:gap-2 hover:text-primary transition-colors"
                    >
                      <span className="font-semibold text-sm sm:text-base">{followingCount.toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs sm:text-sm">following</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 sm:mb-6"
          >
            <ProfileStats
              postsCount={userPosts.length}
              totalLikes={totalLikes}
              totalComments={totalComments}
              totalViews={followersCount * 10} // Placeholder metric
            />
          </motion.div>

          {/* Sidebar Layout for Completion & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Sidebar on mobile - shows first */}
            <div className="lg:hidden space-y-4">
              <RecentActivity userId={profileData.user_id} />
              
              {/* Achievements Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    Achievements
                  </h3>
                  <Link to="/achievements" className="text-xs sm:text-sm text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <BadgeDisplay userId={profileData.user_id} compact />
              </motion.div>
            </div>

            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Profile Completion (only for own profile) */}
              {isOwnProfile && (
                <ProfileCompletion profile={profileData} />
              )}

              {/* Create Post Section (only for own profile) */}
              {isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.user_id}`}
                      alt={profileData.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <Link
                      to="/create"
                      className="flex-1 px-4 py-2.5 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-sm text-left"
                    >
                      What's on your mind, {profileData.display_name.split(' ')[0]}?
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <Link
                        to="/create?type=post"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="hidden sm:inline">Post</span>
                      </Link>
                      <Link
                        to="/create?type=note"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <StickyNote className="w-4 h-4 text-amber-500" />
                        <span className="hidden sm:inline">Note</span>
                      </Link>
                      <Link
                        to="/create?type=video"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <Video className="w-4 h-4 text-rose-500" />
                        <span className="hidden sm:inline">Video</span>
                      </Link>
                    </div>
                    <Button asChild size="sm" className="gap-2">
                      <Link to="/create">
                        <PenSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Create</span>
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Content Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                        isActive
                          ? 'bg-primary/10 text-primary tab-active'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-medium">{tab.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                        {tab.count}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Content Grid */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="grid gap-4"
              >
                {getContent().map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <ContentCard
                      id={item.id}
                      slug={item.slug}
                      type={item.type as 'post' | 'note' | 'video'}
                      title={item.title}
                      author={profileData.display_name}
                      authorAvatar={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.user_id}`}
                      content={item.content}
                      likes={item.likes_count}
                      comments={item.comments_count}
                      timestamp={formatTimeAgo(item.created_at)}
                      tags={item.tags || []}
                      thumbnail={item.video_url || undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Empty State */}
              {getContent().length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    {activeTab === 'posts' && <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />}
                    {activeTab === 'notes' && <StickyNote className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />}
                    {activeTab === 'videos' && <Video className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {isOwnProfile ? `You haven't created any ${activeTab} yet` : `No ${activeTab} yet`}
                  </p>
                  {isOwnProfile && (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/create">
                        <PenSquare className="w-4 h-4 mr-2" />
                        Create your first {activeTab.slice(0, -1)}
                      </Link>
                    </Button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar - Desktop only */}
            <div className="hidden lg:block space-y-4 sm:space-y-6">
              <RecentActivity userId={profileData.user_id} />
              
              {/* Achievements Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Achievements
                  </h3>
                  <Link to="/achievements" className="text-sm text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <BadgeDisplay userId={profileData.user_id} compact />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        type={followersModalType}
        username={profileData.username}
      />

      {/* Profile Edit Sheet */}
      <ProfileEditSheet
        isOpen={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        profile={profileData}
      />
    </div>
  );
};

export default Profile;
