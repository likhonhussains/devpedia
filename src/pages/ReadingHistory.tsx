import { motion } from 'framer-motion';
import { ArrowLeft, History, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import ContentCard from '@/components/ContentCard';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { useAuth } from '@/contexts/AuthContext';

const ReadingHistory = () => {
  const { user } = useAuth();
  const { history, loading, clearHistory, removeFromHistory } = useReadingHistory();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Reading History</h1>
            <p className="text-muted-foreground mb-6">Sign in to track your reading history</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-6">
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <History className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Reading History</h1>
                <p className="text-sm text-muted-foreground">
                  {history.length} {history.length === 1 ? 'article' : 'articles'} read
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearHistory} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
                  <div className="h-3 bg-secondary rounded w-1/2 mb-4" />
                  <div className="h-20 bg-secondary rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && history.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No reading history yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Articles you read will appear here
              </p>
              <Button asChild variant="outline">
                <Link to="/">Explore Articles</Link>
              </Button>
            </motion.div>
          )}

          {/* History Grid */}
          {!loading && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="relative group"
                >
                  <ContentCard
                    id={item.post.id}
                    type={item.post.type as 'post' | 'note' | 'video'}
                    title={item.post.title}
                    author={item.author.display_name}
                    authorAvatar={item.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author.user_id}`}
                    content={item.post.content}
                    likes={item.post.likes_count}
                    comments={item.post.comments_count}
                    timestamp={formatTimeAgo(item.post.created_at)}
                    tags={item.post.tags || []}
                    thumbnail={item.post.video_url || undefined}
                  />
                  <button
                    onClick={() => removeFromHistory(item.post_id)}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-16 right-4 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Read {formatTimeAgo(item.read_at)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReadingHistory;
