import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}

const SearchBar = ({ value, onChange, onFocus }: SearchBarProps) => {
  return (
    <div className="w-[80%] mx-auto">
      <div className="relative group">
        {/* Glow effect on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-center bg-card border border-border/50 rounded-xl transition-all duration-200 group-focus-within:border-primary/30">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder="Search posts, notes, or topics..."
            className="w-full bg-transparent py-4 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="absolute right-3 p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
