import { motion } from 'framer-motion';
import { Code2, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Header = () => {
  // Mock logged in user - in real app this would come from auth context
  const currentUser = {
    username: 'sarahchen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <Code2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">DevPedia</span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Explore
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Community
          </Button>
          
          {currentUser ? (
            <Link to={`/profile/${currentUser.username}`}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <img
                  src={currentUser.avatar}
                  alt="Profile"
                  className="w-7 h-7 rounded-full border-2 border-primary/30"
                />
                <span className="text-sm font-medium hidden sm:inline">Profile</span>
              </motion.div>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          )}
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;
