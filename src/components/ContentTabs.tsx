import { motion } from 'framer-motion';
import { FileText, StickyNote, Video } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex items-center justify-center gap-2 mt-8"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
              isActive
                ? 'bg-primary/10 text-primary tab-active'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default ContentTabs;
