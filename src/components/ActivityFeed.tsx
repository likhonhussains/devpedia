import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  action: string;
  timestamp: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    title: 'React Server Components',
    action: 'New article published',
    timestamp: '5 minutes ago',
  },
  {
    id: '2',
    title: 'TypeScript 5.4 Features',
    action: 'Updated by community',
    timestamp: '23 minutes ago',
  },
  {
    id: '3',
    title: 'Rust for Web Developers',
    action: 'Video uploaded',
    timestamp: '1 hour ago',
  },
];

const ActivityFeed = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mt-6 max-w-xl mx-auto"
    >
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg glass-card hover:glow-border transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <div>
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.action}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivityFeed;
