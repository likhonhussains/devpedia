import { useState } from 'react';
import { motion } from 'framer-motion';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import ContentTabs from '@/components/ContentTabs';
import ContentFeed from '@/components/ContentFeed';
import ActivityFeed from '@/components/ActivityFeed';
import StatsCounter from '@/components/StatsCounter';

const Index = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [showFeed, setShowFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-2">
              <span className="gradient-text">DevPedia</span>
              <span className="text-muted-foreground text-xl md:text-2xl ml-3 font-normal">
                v0.1
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mt-4">
              Where developers share knowledge, code, and ideas
            </p>
          </motion.div>

          {/* Search */}
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
            onFocus={() => setShowFeed(true)}
          />

          {/* Activity Feed (collapsed view) */}
          {!showFeed && <ActivityFeed />}

          {/* Toggle to show full feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setShowFeed(!showFeed)}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              {showFeed ? 'Show recent activity' : 'Browse all content →'}
            </button>
          </motion.div>

          {/* Content Tabs & Feed */}
          {showFeed && (
            <>
              <ContentTabs activeTab={activeTab} onTabChange={setActiveTab} />
              <ContentFeed activeTab={activeTab} searchQuery={searchQuery} />
            </>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-20 flex justify-center gap-12 md:gap-20"
          >
            <StatsCounter value={42847} label="Articles Available" />
            <StatsCounter value={8923} label="Active Contributors" />
            <StatsCounter value={156432} label="Community Members" />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 py-6 px-6 border-t border-border"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 DevPedia. Built for developers, by developers.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">API</a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;
