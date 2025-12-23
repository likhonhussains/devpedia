import { motion } from 'framer-motion';
import { Code2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg">DevPedia</span>
        </motion.div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Explore
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Community
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="w-4 h-4" />
            Login
          </Button>
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;
