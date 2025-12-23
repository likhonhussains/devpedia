import { motion } from 'framer-motion';
import { FileText, StickyNote, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'videos', label: 'Videos', icon: Video },
];

const ContentTabs = ({ activeTab, onTabChange }: ContentTabsProps) => {
  return (
    <div className="flex justify-center mt-10 mb-2">
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className={cn("w-4 h-4 relative z-10", isActive && "text-primary-foreground")} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContentTabs;
