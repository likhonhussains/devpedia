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
    { label: 'Likes', value: totalLikes, icon: Heart, color: 'text-red-500' },
    { label: 'Comments', value: totalComments, icon: MessageCircle, color: 'text-green-500' },
    { label: 'Views', value: totalViews, icon: Eye, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="glass-card rounded-xl p-3 sm:p-4 text-center"
          >
            <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary mb-1 sm:mb-2">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
            </div>
            <p className="text-lg sm:text-2xl font-bold">{stat.value.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProfileStats;
