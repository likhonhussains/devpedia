import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Pencil, BookOpen, Crown, Star, Heart, Trophy, 
  MessageCircle, Users, UserPlus, Award, Lock, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
}

interface UserStats {
  posts: number;
  likes_received: number;
  comments: number;
  following: number;
  followers: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'pencil': Pencil,
  'book-open': BookOpen,
  'crown': Crown,
  'star': Star,
  'heart': Heart,
  'trophy': Trophy,
  'message-circle': MessageCircle,
  'users': Users,
  'user-plus': UserPlus,
  'award': Award,
};

const criteriaLabels: Record<string, string> = {
  'posts': 'Posts Published',
  'likes_received': 'Likes Received',
  'comments': 'Comments Made',
  'following': 'Users Following',
  'followers': 'Followers Gained',
};

const Achievements = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [userStats, setUserStats] = useState<UserStats>({
    posts: 0,
    likes_received: 0,
    comments: 0,
    following: 0,
    followers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all badges
      const { data: badgesData } = await supabase
        .from('badges')
        .select('*')
        .order('criteria_type')
        .order('criteria_value');

      if (badgesData) {
        setBadges(badgesData);
      }

      // Fetch user's earned badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (userBadges) {
        setEarnedBadgeIds(new Set(userBadges.map(ub => ub.badge_id)));
      }

      // Fetch user stats
      const [postsResult, likesResult, commentsResult, followingResult, followersResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published'),
        supabase.from('posts').select('likes_count').eq('user_id', user.id),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      ]);

      const totalLikes = likesResult.data?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

      setUserStats({
        posts: postsResult.count || 0,
        likes_received: totalLikes,
        comments: commentsResult.count || 0,
        following: followingResult.count || 0,
        followers: followersResult.count || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getProgress = (criteriaType: string, criteriaValue: number): number => {
    const currentValue = userStats[criteriaType as keyof UserStats] || 0;
    return Math.min((currentValue / criteriaValue) * 100, 100);
  };

  const getCurrentValue = (criteriaType: string): number => {
    return userStats[criteriaType as keyof UserStats] || 0;
  };

  // Group badges by criteria type
  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.criteria_type]) {
      acc[badge.criteria_type] = [];
    }
    acc[badge.criteria_type].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Achievements</h1>
            <p className="text-muted-foreground">
              Earn badges by being active in the community. Track your progress below!
            </p>
          </div>

          {!user ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Sign in to track your achievements</p>
                <p className="text-muted-foreground">
                  Create an account to start earning badges and tracking your progress.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedBadges).map(([criteriaType, typeBadges]) => (
                <Card key={criteriaType}>
                  <CardHeader>
                    <CardTitle className="text-lg">{criteriaLabels[criteriaType] || criteriaType}</CardTitle>
                    <CardDescription>
                      Current: {getCurrentValue(criteriaType)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {typeBadges.map((badge, index) => {
                        const IconComponent = iconMap[badge.icon] || Star;
                        const isEarned = earnedBadgeIds.has(badge.id);
                        const progress = getProgress(badge.criteria_type, badge.criteria_value);
                        const currentValue = getCurrentValue(badge.criteria_type);

                        return (
                          <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                              relative p-4 rounded-lg border transition-all
                              ${isEarned 
                                ? 'bg-primary/10 border-primary/30' 
                                : 'bg-muted/30 border-border'
                              }
                            `}
                          >
                            {isEarned && (
                              <div className="absolute top-2 right-2">
                                <div className="bg-primary rounded-full p-1">
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`
                                flex items-center justify-center w-12 h-12 rounded-full
                                ${isEarned 
                                  ? 'bg-primary/20' 
                                  : 'bg-muted'
                                }
                              `}>
                                <IconComponent className={`w-6 h-6 ${isEarned ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold truncate ${!isEarned && 'text-muted-foreground'}`}>
                                  {badge.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {badge.description}
                                </p>
                              </div>
                            </div>

                            {!isEarned && (
                              <div className="space-y-1">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground text-right">
                                  {currentValue} / {badge.criteria_value}
                                </p>
                              </div>
                            )}

                            {isEarned && (
                              <p className="text-xs text-primary font-medium">
                                ✓ Earned
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Achievements;
