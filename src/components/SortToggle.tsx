import { motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortMode = 'recent' | 'popular';

interface SortToggleProps {
  activeSort: SortMode;
  onSortChange: (sort: SortMode) => void;
}

const SortToggle = ({ activeSort, onSortChange }: SortToggleProps) => {
  const options = [
    { id: 'recent' as SortMode, label: 'Recent', icon: Clock },
    { id: 'popular' as SortMode, label: 'Most Liked', icon: Flame },
  ];

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = activeSort === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onSortChange(option.id)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSortMode"
                  className="absolute inset-0 bg-primary rounded-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className={cn("w-3.5 h-3.5 relative z-10", isActive && "text-primary-foreground")} />
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SortToggle;
