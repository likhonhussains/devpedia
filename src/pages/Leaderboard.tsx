import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Award, Flame, Heart, FileText, MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParticleBackground from '@/components/ParticleBackground';
import BadgeDisplay from '@/components/BadgeDisplay';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  badge_count?: number;
  post_count?: number;
  likes_received?: number;
  comment_count?: number;
  activity_score?: number;
}

const Leaderboard = () => {
  const [badgeLeaders, setBadgeLeaders] = useState<LeaderboardUser[]>([]);
  const [activityLeaders, setActivityLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true);

      // Fetch badge leaderboard
      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('user_id');

      // Count badges per user
      const badgeCounts: Record<string, number> = {};
      badgeData?.forEach((item) => {
        badgeCounts[item.user_id] = (badgeCounts[item.user_id] || 0) + 1;
      });

      // Get top users by badge count
      const topBadgeUserIds = Object.entries(badgeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      if (topBadgeUserIds.length > 0) {
        const { data: badgeProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', topBadgeUserIds);

        const badgeLeadersList = badgeProfiles?.map((profile) => ({
          ...profile,
          badge_count: badgeCounts[profile.user_id] || 0,
        })).sort((a, b) => (b.badge_count || 0) - (a.badge_count || 0)) || [];

        setBadgeLeaders(badgeLeadersList);
      }

      // Fetch activity leaderboard (posts, likes received, comments)
      const { data: posts } = await supabase
        .from('posts')
        .select('user_id, likes_count');

      const { data: comments } = await supabase
        .from('comments')
        .select('user_id');

      // Calculate activity scores
      const activityScores: Record<string, { posts: number; likes: number; comments: number }> = {};

      posts?.forEach((post) => {
        if (!activityScores[post.user_id]) {
          activityScores[post.user_id] = { posts: 0, likes: 0, comments: 0 };
        }
        activityScores[post.user_id].posts += 1;
        activityScores[post.user_id].likes += post.likes_count || 0;
      });

      comments?.forEach((comment) => {
        if (!activityScores[comment.user_id]) {
          activityScores[comment.user_id] = { posts: 0, likes: 0, comments: 0 };
        }
        activityScores[comment.user_id].comments += 1;
      });

      // Calculate total activity score (posts * 10 + likes + comments * 5)
      const topActivityUserIds = Object.entries(activityScores)
        .map(([userId, stats]) => ({
          userId,
          score: stats.posts * 10 + stats.likes + stats.comments * 5,
          ...stats,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      if (topActivityUserIds.length > 0) {
        const { data: activityProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', topActivityUserIds.map((u) => u.userId));

        const activityLeadersList = activityProfiles?.map((profile) => {
          const stats = topActivityUserIds.find((u) => u.userId === profile.user_id);
          return {
            ...profile,
            post_count: stats?.posts || 0,
            likes_received: stats?.likes || 0,
            comment_count: stats?.comments || 0,
            activity_score: stats?.score || 0,
          };
        }).sort((a, b) => (b.activity_score || 0) - (a.activity_score || 0)) || [];

        setActivityLeaders(activityLeadersList);
      }

      setLoading(false);
    };

    fetchLeaderboards();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30';
      default:
        return 'bg-secondary/50 border-border';
    }
  };

  const LeaderboardItem = ({ user, rank, type }: { user: LeaderboardUser; rank: number; type: 'badges' | 'activity' }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
    >
      <Link
        to={`/profile/${user.username}`}
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] ${getRankBg(rank)}`}
      >
        <div className="flex-shrink-0 w-8 flex justify-center">
          {getRankIcon(rank)}
        </div>

        <Avatar className="h-12 w-12 border-2 border-border">
          <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
          <AvatarFallback>{user.display_name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user.display_name}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>

        {type === 'badges' ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <BadgeDisplay userId={user.user_id} compact />
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              <Award className="w-4 h-4" />
              <span className="font-bold">{user.badge_count}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{user.post_count}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
              <Heart className="w-4 h-4" />
              <span>{user.likes_received}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>{user.comment_count}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              <Flame className="w-4 h-4" />
              <span className="font-bold">{user.activity_score}</span>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <main className="relative z-10 pt-6 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
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
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">Top contributors in our community</p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="badges" className="gap-2">
                <Award className="w-4 h-4" />
                Most Badges
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Flame className="w-4 h-4" />
                Most Active
              </TabsTrigger>
            </TabsList>

            <TabsContent value="badges">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : badgeLeaders.length > 0 ? (
                <div className="space-y-3">
                  {badgeLeaders.map((user, index) => (
                    <LeaderboardItem key={user.user_id} user={user} rank={index + 1} type="badges" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No badges earned yet. Be the first!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : activityLeaders.length > 0 ? (
                <div className="space-y-3">
                  {activityLeaders.map((user, index) => (
                    <LeaderboardItem key={user.user_id} user={user} rank={index + 1} type="activity" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Flame className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No activity yet. Start posting!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Score Explanation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border text-sm text-muted-foreground"
          >
            <p className="font-medium text-foreground mb-2">How is the activity score calculated?</p>
            <ul className="space-y-1">
              <li>• Each post: <span className="text-primary font-medium">+10 points</span></li>
              <li>• Each like received: <span className="text-primary font-medium">+1 point</span></li>
              <li>• Each comment: <span className="text-primary font-medium">+5 points</span></li>
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
