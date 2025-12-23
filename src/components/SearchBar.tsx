import { motion } from 'framer-motion';
import { Search, ArrowUp } from 'lucide-react';
import { useState } from 'react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className={`relative flex items-center rounded-xl transition-all duration-300 glass-card ${
          isFocused ? 'glow-border' : ''
        }`}
      >
        <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search posts, notes, videos, or topics..."
          className="w-full bg-transparent py-4 pl-12 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SearchBar;
