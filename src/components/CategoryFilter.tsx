import { motion } from 'framer-motion';
import { 
  Monitor, 
  Wrench, 
  BarChart3, 
  Shield, 
  Palette, 
  Brain, 
  Code, 
  Sparkles,
  LayoutGrid,
  Cloud
} from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'it', label: 'IT', icon: Monitor },
  { id: 'engineering', label: 'Engineering', icon: Wrench },
  { id: 'data-science', label: 'Data Science', icon: BarChart3 },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: Shield },
  { id: 'cloud-computing', label: 'Cloud Computing', icon: Cloud },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'ai', label: 'AI', icon: Brain },
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'agi', label: 'AGI', icon: Sparkles },
];

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <motion.button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{category.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export const categoryOptions = categories.filter(c => c.id !== 'all');

export default CategoryFilter;