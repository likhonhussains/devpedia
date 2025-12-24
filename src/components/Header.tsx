import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, LogOut, User, History, MessageCircle, Users, Trophy, FileEdit, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useMessages } from '@/hooks/useMessages';
import NotificationBell from '@/components/NotificationBell';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { getTotalUnreadCount } = useMessages();
  const navigate = useNavigate();
  const unreadCount = getTotalUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-sm">Basic Comet</span>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <>
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/achievements')}
                >
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Achievements</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/leaderboard')}
                >
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">Leaderboard</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/users')}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">People</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/history')}
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground relative"
                  onClick={() => navigate('/messages')}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/drafts')}
                >
                  <FileEdit className="w-4 h-4" />
                  <span className="hidden sm:inline">Drafts</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/create')}
                >
                  <PenLine className="w-4 h-4" />
                  <span className="hidden sm:inline">Create</span>
                </Button>

                <Link
                  to={`/profile/${profile?.username || 'me'}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <img
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full ring-1 ring-border"
                  />
                  <span className="text-sm font-medium hidden sm:inline max-w-24 truncate">
                    {profile?.display_name}
                  </span>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Sign in
              </Button>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
