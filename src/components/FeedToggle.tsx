import { motion } from 'framer-motion';
import { Globe, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export type FeedMode = 'all' | 'following' | 'recommended';

interface FeedToggleProps {
  activeMode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
}

const FeedToggle = ({ activeMode, onModeChange }: FeedToggleProps) => {
  const { user } = useAuth();

  // Don't show toggle if user is not logged in
  if (!user) return null;

  const modes = [
    { id: 'all' as FeedMode, label: 'All', icon: Globe },
    { id: 'recommended' as FeedMode, label: 'For You', icon: Sparkles },
    { id: 'following' as FeedMode, label: 'Following', icon: Users },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeFeedMode"
                className="absolute inset-0 bg-primary rounded-md"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon className={cn("w-4 h-4 relative z-10", isActive && "text-primary-foreground")} />
            <span className="relative z-10">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FeedToggle;
