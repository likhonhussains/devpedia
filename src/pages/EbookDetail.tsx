import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Star, Eye, Heart, Bookmark, ChevronRight, Clock, Send, Trash2, FileText, Download, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEbook, useEbookReviews, useEbookInteractions, GENRE_LABELS, EbookGenre, EbookChapter } from '@/hooks/useEbooks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn(
            "transition-colors",
            interactive && "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              "w-5 h-5",
              (hover || rating) >= star
                ? "fill-yellow-500 text-yellow-500"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
};

const EbookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { ebook, chapters, loading } = useEbook(id);
  const { reviews, userReview, addReview, deleteReview } = useEbookReviews(id);
  const { isLiked, isBookmarked, toggleLike, toggleBookmark } = useEbookInteractions(id);

  const [activeTab, setActiveTab] = useState('chapters');
  const [selectedChapter, setSelectedChapter] = useState<EbookChapter | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) return;
    setIsSubmitting(true);
    const success = await addReview(reviewRating, reviewContent);
    if (success) {
      setReviewContent('');
      setReviewRating(5);
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-secondary rounded w-48" />
              <div className="flex gap-8">
                <div className="w-64 h-96 bg-secondary rounded-xl" />
                <div className="flex-1 space-y-4">
                  <div className="h-10 bg-secondary rounded w-3/4" />
                  <div className="h-6 bg-secondary rounded w-1/2" />
                  <div className="h-24 bg-secondary rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-2xl font-bold mb-2">eBook not found</h1>
            <p className="text-muted-foreground mb-6">The eBook you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/ebooks">Browse eBooks</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (selectedChapter) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => setSelectedChapter(null)}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {ebook.title}</span>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 md:p-12"
            >
              <div className="mb-8">
                <span className="text-sm text-muted-foreground">Chapter {selectedChapter.chapter_order}</span>
                <h1 className="text-3xl font-bold mt-1">{selectedChapter.title}</h1>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {selectedChapter.content}
                </ReactMarkdown>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-12 pt-6 border-t border-border">
                {selectedChapter.chapter_order > 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const prev = chapters.find(c => c.chapter_order === selectedChapter.chapter_order - 1);
                      if (prev) setSelectedChapter(prev);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Chapter
                  </Button>
                ) : (
                  <div />
                )}
                {selectedChapter.chapter_order < chapters.length && (
                  <Button
                    onClick={() => {
                      const next = chapters.find(c => c.chapter_order === selectedChapter.chapter_order + 1);
                      if (next) setSelectedChapter(next);
                    }}
                  >
                    Next Chapter
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              to="/ebooks"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to eBooks</span>
            </Link>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full md:w-64 flex-shrink-0"
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                {ebook.cover_url ? (
                  <img
                    src={ebook.cover_url}
                    alt={ebook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <span className="text-sm px-3 py-1 rounded-full bg-primary/20 text-primary">
                {GENRE_LABELS[ebook.genre as EbookGenre]}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mt-3 mb-2">{ebook.title}</h1>
              
              {ebook.author && (
                <Link
                  to={`/profile/${ebook.author.username}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={ebook.author.avatar_url || undefined} />
                    <AvatarFallback>{ebook.author.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <span>by {ebook.author.display_name}</span>
                </Link>
              )}

              {ebook.description && (
                <p className="text-muted-foreground mb-6">{ebook.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
                <span className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{ebook.average_rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted-foreground">({ebook.reviews_count} reviews)</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="w-5 h-5" />
                  {ebook.views_count} views
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-5 h-5" />
                  {ebook.likes_count} likes
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  {formatDate(ebook.created_at)}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* PDF eBook - show download/view buttons */}
                {ebook.pdf_url && (
                  <>
                    <Button asChild>
                      <a href={ebook.pdf_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Read PDF
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={ebook.pdf_url} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </a>
                    </Button>
                  </>
                )}
                
                {/* Chapter-based eBook - show start reading button */}
                {!ebook.pdf_url && chapters.length > 0 && (
                  <Button onClick={() => setSelectedChapter(chapters[0])}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start Reading
                  </Button>
                )}
                
                {user && (
                  <>
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      onClick={toggleLike}
                    >
                      <Heart className={cn("w-4 h-4 mr-2", isLiked && "fill-current")} />
                      {isLiked ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                      variant={isBookmarked ? "default" : "outline"}
                      onClick={toggleBookmark}
                    >
                      <Bookmark className={cn("w-4 h-4 mr-2", isBookmarked && "fill-current")} />
                      {isBookmarked ? 'Saved' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Only show tabs if not a PDF-only ebook, or show different content */}
          {ebook.pdf_url ? (
            /* PDF eBook - Show embedded viewer and reviews */
            <div className="space-y-8">
              {/* PDF Viewer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium">PDF eBook</span>
                </div>
                <div className="aspect-[4/3] md:aspect-[16/9]">
                  <iframe
                    src={`${ebook.pdf_url}#view=FitH`}
                    className="w-full h-full"
                    title={ebook.title}
                  />
                </div>
              </motion.div>

              {/* Reviews Section for PDF */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Reviews ({reviews.length})
                </h2>
                
                {/* Add Review */}
                {user && !userReview && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-xl p-6"
                  >
                    <h3 className="font-semibold mb-4">Write a Review</h3>
                    <div className="mb-4">
                      <label className="text-sm text-muted-foreground mb-2 block">Your Rating</label>
                      <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
                    </div>
                    <Textarea
                      placeholder="Share your thoughts about this eBook..."
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="mb-4"
                      rows={4}
                    />
                    <Button onClick={handleSubmitReview} disabled={isSubmitting || !reviewContent.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </Button>
                  </motion.div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                      No reviews yet. Be the first to review!
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-xl p-6"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={review.author?.avatar_url || undefined} />
                              <AvatarFallback>{review.author?.display_name[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.author?.display_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} />
                            {review.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteReview(review.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {review.content && (
                          <p className="text-muted-foreground">{review.content}</p>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Chapter-based eBook - Show tabs */
            <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="chapters" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Chapters ({chapters.length})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="w-4 h-4" />
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chapters" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl divide-y divide-border"
              >
                {chapters.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No chapters yet
                  </div>
                ) : (
                  chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapter(chapter)}
                      className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-sm text-muted-foreground">Chapter {chapter.chapter_order}</span>
                        <h3 className="font-medium">{chapter.title}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6 space-y-6">
              {/* Add Review */}
              {user && !userReview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl p-6"
                >
                  <h3 className="font-semibold mb-4">Write a Review</h3>
                  <div className="mb-4">
                    <label className="text-sm text-muted-foreground mb-2 block">Your Rating</label>
                    <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
                  </div>
                  <Textarea
                    placeholder="Share your thoughts about this eBook..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="mb-4"
                    rows={4}
                  />
                  <Button onClick={handleSubmitReview} disabled={isSubmitting || !reviewContent.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Review
                  </Button>
                </motion.div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                    No reviews yet. Be the first to review!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={review.author?.avatar_url || undefined} />
                            <AvatarFallback>{review.author?.display_name[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.author?.display_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          {review.user_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteReview(review.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {review.content && (
                        <p className="text-muted-foreground">{review.content}</p>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default EbookDetail;
