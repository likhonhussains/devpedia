import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, Users, UserPlus, Edit3, FileText, StickyNote, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import ContentCard from '@/components/ContentCard';

const tabs = [
  { id: 'posts', label: 'Posts', icon: FileText, count: 12 },
  { id: 'notes', label: 'Notes', icon: StickyNote, count: 28 },
  { id: 'videos', label: 'Videos', icon: Video, count: 5 },
];

// Mock user data
const userData = {
  username: 'sarahchen',
  displayName: 'Sarah Chen',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  bio: 'Senior Frontend Engineer @TechCorp | React enthusiast | Building tools that make developers happy. Previously @StartupX. Open source contributor.',
  location: 'San Francisco, CA',
  website: 'sarahchen.dev',
  joinDate: 'March 2023',
  followers: 2847,
  following: 342,
  isOwnProfile: true,
};

const userContent = {
  posts: [
    {
      type: 'post' as const,
      title: 'Understanding React Server Components: A Deep Dive',
      author: 'Sarah Chen',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'React Server Components represent a fundamental shift in how we think about React applications...',
      likes: 234,
      comments: 45,
      timestamp: '2 hours ago',
      tags: ['react', 'nextjs', 'webdev'],
    },
    {
      type: 'post' as const,
      title: 'State Management in 2024: What Actually Works',
      author: 'Sarah Chen',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'After years of trying every state management solution, here\'s what I actually recommend for different project sizes...',
      likes: 567,
      comments: 89,
      timestamp: '2 days ago',
      tags: ['react', 'state', 'redux'],
    },
  ],
  notes: [
    {
      type: 'note' as const,
      title: 'Quick Tip: useCallback vs useMemo',
      author: 'Sarah Chen',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'useCallback memoizes functions, useMemo memoizes values. Use useCallback when passing callbacks to optimized child components.',
      likes: 345,
      comments: 23,
      timestamp: '1 day ago',
      tags: ['react', 'hooks'],
    },
    {
      type: 'note' as const,
      title: 'CSS Container Queries Cheat Sheet',
      author: 'Sarah Chen',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: '@container (min-width: 400px) { .card { display: grid; } } - Use container-type: inline-size on parent.',
      likes: 189,
      comments: 12,
      timestamp: '3 days ago',
      tags: ['css', 'tips'],
    },
  ],
  videos: [
    {
      type: 'video' as const,
      title: 'Building a Design System from Scratch',
      author: 'Sarah Chen',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'Learn how to create a scalable design system with tokens, components, and documentation.',
      likes: 892,
      comments: 67,
      timestamp: '1 week ago',
      thumbnail: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&q=80',
      tags: ['design', 'tutorial'],
    },
  ],
};

const Profile = () => {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  const getContent = () => {
    switch (activeTab) {
      case 'notes':
        return userContent.notes;
      case 'videos':
        return userContent.videos;
      default:
        return userContent.posts;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <main className="relative z-10 pt-6 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to feed</span>
            </Link>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <img
                    src={userData.avatar}
                    alt={userData.displayName}
                    className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-primary/20"
                  />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
                </div>
              </motion.div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">{userData.displayName}</h1>
                    <p className="text-muted-foreground font-mono text-sm">@{userData.username}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {userData.isOwnProfile ? (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        variant={isFollowing ? 'outline' : 'default'}
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsFollowing(!isFollowing)}
                      >
                        <UserPlus className="w-4 h-4" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p className="mt-4 text-foreground/90 leading-relaxed">{userData.bio}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {userData.location}
                  </span>
                  <a
                    href={`https://${userData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {userData.website}
                  </a>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Joined {userData.joinDate}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-5">
                  <button className="group flex items-center gap-2 hover:text-primary transition-colors">
                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="font-semibold">{userData.followers.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">followers</span>
                  </button>
                  <button className="group flex items-center gap-2 hover:text-primary transition-colors">
                    <span className="font-semibold">{userData.following.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">following</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary/10 text-primary tab-active'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Content Grid */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {getContent().map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ContentCard {...item} />
              </motion.div>
            ))}
          </motion.div>

          {getContent().length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
            >
              <p>No {activeTab} yet</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
