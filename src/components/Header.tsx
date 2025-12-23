import { motion } from 'framer-motion';
import { Code2, LogIn, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:flex">
            Explore
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:flex">
            Community
          </Button>
          
          {user && profile ? (
            <>
              <Link to="/create">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </Link>
              <Link to={`/profile/${profile.username}`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt="Profile"
                    className="w-7 h-7 rounded-full border-2 border-primary/30"
                  />
                  <span className="text-sm font-medium hidden md:inline">{profile.display_name}</span>
                </motion.div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;
