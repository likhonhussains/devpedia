import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Plus, Star, Eye, Heart, BookMarked, Filter } from 'lucide-react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEbooks, useMyBookmarks, GENRE_LABELS, EbookGenre, Ebook } from '@/hooks/useEbooks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const EbookCard = ({ ebook }: { ebook: Ebook }) => {
  return (
    <Link to={`/ebooks/${ebook.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="glass-card rounded-xl overflow-hidden group cursor-pointer"
      >
        <div className="aspect-[3/4] relative bg-gradient-to-br from-primary/20 to-secondary/20">
          {ebook.cover_url ? (
            <img
              src={ebook.cover_url}
              alt={ebook.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
              {GENRE_LABELS[ebook.genre as EbookGenre]}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {ebook.title}
          </h3>
          {ebook.author && (
            <p className="text-sm text-muted-foreground mb-3">
              by {ebook.author.display_name}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {ebook.average_rating?.toFixed(1) || '0.0'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {ebook.views_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {ebook.likes_count}
            </span>
          </div>
          {ebook.chapters_count !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">
              {ebook.chapters_count} chapters
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

const Ebooks = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<EbookGenre | 'all'>('all');
  const [activeTab, setActiveTab] = useState('browse');

  const { ebooks, loading } = useEbooks(
    selectedGenre === 'all' ? undefined : selectedGenre,
    searchQuery
  );
  const { ebooks: bookmarkedEbooks, loading: bookmarksLoading } = useMyBookmarks();

  const genres = Object.entries(GENRE_LABELS);

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">eBook Library</h1>
                <p className="text-muted-foreground">Discover and publish eBooks</p>
              </div>
            </div>
            {user && (
              <Button asChild>
                <Link to="/ebooks/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Publish eBook
                </Link>
              </Button>
            )}
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="browse" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Browse
              </TabsTrigger>
              {user && (
                <TabsTrigger value="library" className="gap-2">
                  <BookMarked className="w-4 h-4" />
                  My Library
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search eBooks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedGenre}
                  onValueChange={(v) => setSelectedGenre(v as EbookGenre | 'all')}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* eBooks Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                      <div className="aspect-[3/4] bg-secondary" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-4 bg-secondary rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ebooks.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No eBooks found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? 'Try a different search term' : 'Be the first to publish an eBook!'}
                  </p>
                  {user && (
                    <Button asChild>
                      <Link to="/ebooks/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Publish eBook
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {ebooks.map((ebook) => (
                    <EbookCard key={ebook.id} ebook={ebook} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              {bookmarksLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                      <div className="aspect-[3/4] bg-secondary" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : bookmarkedEbooks.length === 0 ? (
                <div className="text-center py-16">
                  <BookMarked className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
                  <p className="text-muted-foreground mb-6">
                    Bookmark eBooks to add them to your library
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('browse')}>
                    Browse eBooks
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {bookmarkedEbooks.map((ebook) => (
                    <EbookCard key={ebook.id} ebook={ebook} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Ebooks;
