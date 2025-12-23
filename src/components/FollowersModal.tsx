import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  username: string;
}

const mockFollowers: User[] = [
  {
    id: '1',
    username: 'alexrivera',
    displayName: 'Alex Rivera',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Full-stack developer | Rust enthusiast',
    isFollowing: true,
  },
  {
    id: '2',
    username: 'emmawilson',
    displayName: 'Emma Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    bio: 'TypeScript advocate | Open source contributor',
    isFollowing: false,
  },
  {
    id: '3',
    username: 'marcusjohnson',
    displayName: 'Marcus Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    bio: 'DevOps Engineer | Cloud architecture',
    isFollowing: true,
  },
  {
    id: '4',
    username: 'devacademy',
    displayName: 'Dev Academy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevAcademy',
    bio: 'Tech tutorials and courses',
    isFollowing: false,
  },
  {
    id: '5',
    username: 'cloudnative',
    displayName: 'Cloud Native',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CloudNative',
    bio: 'Kubernetes | Docker | Cloud infrastructure',
    isFollowing: true,
  },
];

const mockFollowing: User[] = [
  {
    id: '6',
    username: 'techguru',
    displayName: 'Tech Guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechGuru',
    bio: 'Software architect | 15+ years experience',
    isFollowing: true,
  },
  {
    id: '7',
    username: 'codemaster',
    displayName: 'Code Master',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
    bio: 'Clean code advocate | Design patterns',
    isFollowing: true,
  },
  {
    id: '8',
    username: 'reactdev',
    displayName: 'React Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ReactDev',
    bio: 'React core team | Building the future of UI',
    isFollowing: true,
  },
];

const FollowersModal = ({ isOpen, onClose, type, username }: FollowersModalProps) => {
  const [users, setUsers] = useState<User[]>(type === 'followers' ? mockFollowers : mockFollowing);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFollow = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isFollowing: !user.isFollowing }
        : user
    ));
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[80vh] z-50"
          >
            <div className="glass-card rounded-2xl overflow-hidden border border-border">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold capitalize">{type}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-secondary rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="overflow-y-auto max-h-[50vh] p-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                      >
                        <Link
                          to={`/profile/${user.username}`}
                          onClick={onClose}
                          className="flex-shrink-0"
                        >
                          <img
                            src={user.avatar}
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${user.username}`}
                            onClick={onClose}
                            className="block"
                          >
                            <p className="font-medium text-sm truncate hover:text-primary transition-colors">
                              {user.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              @{user.username}
                            </p>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {user.bio}
                          </p>
                        </div>

                        <Button
                          variant={user.isFollowing ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => toggleFollow(user.id)}
                          className="flex-shrink-0 gap-1.5"
                        >
                          {user.isFollowing ? (
                            <>
                              <UserMinus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Follow</span>
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FollowersModal;
