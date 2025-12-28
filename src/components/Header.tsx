import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, History, MessageCircle, Users, Trophy, Award, Menu, BookOpen, UsersRound, Globe, UserCheck, Library, BookMarked, Settings, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useMessages } from '@/hooks/useMessages';
import NotificationBell from '@/components/NotificationBell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import logoIcon from '@/assets/logo.png';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { getTotalUnreadCount } = useMessages();
  const navigate = useNavigate();
  const unreadCount = getTotalUnreadCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const menuItems = [
    { icon: Award, label: 'Achievements', path: '/achievements' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Users, label: 'People', path: '/users' },
    { icon: History, label: 'History', path: '/history' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', badge: unreadCount },
  ];

  const groupItems = [
    { icon: Globe, label: 'Browse Groups', path: '/groups' },
    { icon: UserCheck, label: 'My Groups', path: '/groups?filter=my' },
  ];

  const ebookItems = [
    { icon: Library, label: 'Browse eBooks', path: '/ebooks' },
    { icon: BookMarked, label: 'My eBooks', path: '/my-ebooks' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50">
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5">
              <img src={logoIcon} alt="Basic Comet" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sm whitespace-nowrap">Basic Comet</span>
          </Link>

          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-0.5">
                  <NotificationBell />
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-foreground relative"
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Button>
                  ))}

                  {/* Groups Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <UsersRound className="w-4 h-4" />
                        <span className="hidden lg:inline">Groups</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                      {groupItems.map((item) => (
                        <DropdownMenuItem 
                          key={item.path} 
                          onSelect={() => navigate(item.path)}
                          className="cursor-pointer gap-2"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* eBooks Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden lg:inline">eBooks</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                      {ebookItems.map((item) => (
                        <DropdownMenuItem 
                          key={item.path} 
                          onSelect={() => navigate(item.path)}
                          className="cursor-pointer gap-2"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 px-2 py-1.5 h-auto hover:bg-secondary/50 group"
                      >
                        <div className="relative">
                          <img
                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt="Avatar"
                            className="w-7 h-7 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                        </div>
                        <div className="hidden lg:flex flex-col items-start">
                          <span className="text-sm font-medium max-w-20 truncate leading-tight">
                            {profile?.display_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            @{profile?.username}
                          </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-muted-foreground hidden lg:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-popover border border-border z-50 p-0 overflow-hidden">
                      {/* Profile Header */}
                      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                              alt="Avatar"
                              className="w-12 h-12 rounded-full ring-2 ring-primary/30"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-popover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{profile?.display_name}</p>
                            <p className="text-sm text-muted-foreground truncate">@{profile?.username}</p>
                          </div>
                          <Sparkles className="w-5 h-5 text-primary/60" />
                        </div>
                      </div>
                      
                      <div className="p-1">
                        <DropdownMenuItem 
                          onSelect={() => navigate(`/profile/${profile?.username || 'me'}`)}
                          className="cursor-pointer gap-3 py-2.5 px-3 rounded-lg"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>View Profile</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onSelect={() => navigate('/achievements')}
                          className="cursor-pointer gap-3 py-2.5 px-3 rounded-lg"
                        >
                          <Award className="w-4 h-4 text-muted-foreground" />
                          <span>My Achievements</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onSelect={() => navigate('/history')}
                          className="cursor-pointer gap-3 py-2.5 px-3 rounded-lg"
                        >
                          <History className="w-4 h-4 text-muted-foreground" />
                          <span>Reading History</span>
                        </DropdownMenuItem>
                      </div>
                      
                      <DropdownMenuSeparator className="my-1" />
                      
                      <div className="p-1">
                        <DropdownMenuItem 
                          onSelect={handleSignOut}
                          className="cursor-pointer gap-3 py-2.5 px-3 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-1">
                  <NotificationBell />
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72 p-0">
                      <div className="flex flex-col h-full">
                        {/* Profile Section */}
                        <div 
                          className="p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
                          onClick={() => handleNavigate(`/profile/${profile?.username || 'me'}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full ring-2 ring-primary/30 shadow-lg"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{profile?.display_name}</p>
                              <p className="text-sm text-muted-foreground truncate">@{profile?.username}</p>
                            </div>
                            <Sparkles className="w-5 h-5 text-primary/60" />
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 py-2">
                          {menuItems.map((item) => (
                            <button
                              key={item.path}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors relative"
                              onClick={() => handleNavigate(item.path)}
                            >
                              <item.icon className="w-5 h-5 text-muted-foreground" />
                              <span>{item.label}</span>
                              {item.badge && item.badge > 0 && (
                                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                  {item.badge > 9 ? '9+' : item.badge}
                                </span>
                              )}
                            </button>
                          ))}
                          {/* Groups submenu in mobile */}
                          <div className="px-4 py-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Groups</p>
                            {groupItems.map((item) => (
                              <button
                                key={item.path}
                                className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-secondary/50 transition-colors rounded-md"
                                onClick={() => handleNavigate(item.path)}
                              >
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{item.label}</span>
                              </button>
                            ))}
                          </div>
                          {/* eBooks submenu in mobile */}
                          <div className="px-4 py-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">eBooks</p>
                            {ebookItems.map((item) => (
                              <button
                                key={item.path}
                                className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-secondary/50 transition-colors rounded-md"
                                onClick={() => handleNavigate(item.path)}
                              >
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sign Out */}
                        <div className="p-4 border-t border-border">
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleSignOut}
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
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
