import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import ContentTabs from '@/components/ContentTabs';
import ContentFeed from '@/components/ContentFeed';

const Index = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [showFeed, setShowFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen relative">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-background to-background pointer-events-none" />
      
      <Header />

      <main className="relative z-10 pt-[80px] pb-[80px] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="gradient-text">DevPedia</span>
            </h1>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery}
              onFocus={() => setShowFeed(true)}
            />
          </motion.div>

          {/* Browse CTA */}
          {!showFeed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-10"
            >
              <button
                onClick={() => setShowFeed(true)}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Browse all content</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </motion.div>
          )}

          {/* Content Tabs & Feed */}
          {showFeed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ContentTabs activeTab={activeTab} onTabChange={setActiveTab} />
              <ContentFeed activeTab={activeTab} searchQuery={searchQuery} />
              
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowFeed(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to home
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 DevPedia</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
