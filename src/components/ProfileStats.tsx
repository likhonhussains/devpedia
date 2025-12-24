import { motion } from 'framer-motion';
import { Heart, MessageCircle, FileText, Eye } from 'lucide-react';

interface ProfileStatsProps {
  postsCount: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
}

const ProfileStats = ({ postsCount, totalLikes, totalComments, totalViews }: ProfileStatsProps) => {
  const stats = [
    { label: 'Posts', value: postsCount, icon: FileText, color: 'text-blue-500' },
    { label: 'Likes Received', value: totalLikes, icon: Heart, color: 'text-red-500' },
    { label: 'Comments', value: totalComments, icon: MessageCircle, color: 'text-green-500' },
    { label: 'Profile Views', value: totalViews, icon: Eye, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary mb-2`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProfileStats;
