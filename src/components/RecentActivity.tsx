import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, Award, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'badge';
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  userId: string;
}

const RecentActivity = ({ userId }: RecentActivityProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const allActivities: Activity[] = [];

      // Fetch recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (posts) {
        posts.forEach(post => {
          allActivities.push({
            id: `post-${post.id}`,
            type: 'post',
            description: `Published "${post.title}"`,
            timestamp: post.created_at,
          });
        });
      }

      // Fetch recent comments
      const { data: comments } = await supabase
        .from('comments')
        .select('id, created_at, posts(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (comments) {
        comments.forEach((comment: any) => {
          allActivities.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            description: `Commented on "${comment.posts?.title || 'a post'}"`,
            timestamp: comment.created_at,
          });
        });
      }

      // Fetch recent follows
      const { data: follows } = await supabase
        .from('followers')
        .select('id, created_at, following_id')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (follows) {
        // Get profile names for followed users
        const followingIds = follows.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', followingIds);

        follows.forEach(follow => {
          const profile = profiles?.find(p => p.user_id === follow.following_id);
          allActivities.push({
            id: `follow-${follow.id}`,
            type: 'follow',
            description: `Started following ${profile?.display_name || 'someone'}`,
            timestamp: follow.created_at,
          });
        });
      }

      // Fetch recent badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select('id, earned_at, badges(name)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(3);

      if (badges) {
        badges.forEach((badge: any) => {
          allActivities.push({
            id: `badge-${badge.id}`,
            type: 'badge',
            description: `Earned the "${badge.badges?.name}" badge`,
            timestamp: badge.earned_at,
          });
        });
      }

      // Sort by timestamp and take top 5
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(allActivities.slice(0, 5));
      setLoading(false);
    };

    fetchActivity();
  }, [userId]);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'post': return FileText;
      case 'comment': return MessageCircle;
      case 'like': return Heart;
      case 'follow': return UserPlus;
      case 'badge': return Award;
    }
  };

  const getIconColor = (type: Activity['type']) => {
    switch (type) {
      case 'post': return 'text-blue-500 bg-blue-500/10';
      case 'comment': return 'text-green-500 bg-green-500/10';
      case 'like': return 'text-red-500 bg-red-500/10';
      case 'follow': return 'text-purple-500 bg-purple-500/10';
      case 'badge': return 'text-amber-500 bg-amber-500/10';
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-secondary/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4"
    >
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = getIcon(activity.type);
          const colorClass = getIconColor(activity.type);
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RecentActivity;
