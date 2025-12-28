import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Calendar,
  Clock,
  Send,
  Loader2,
  Edit,
  User,
  TrendingUp,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/useComments';
import { useLikePost } from '@/hooks/useLikePost';
import { formatDistanceToNow, format } from 'date-fns';
import ShareDropdown from '@/components/ShareDropdown';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import VoiceRecorder from '@/components/VoiceRecorder';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';

const Article = () => {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isRecordingMode, setIsRecordingMode] = useState(false);

  // Fetch post data from database - try slug first, then id for backward compatibility
  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      // Try to find by slug first
      let { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      // If not found by slug, try by id for backward compatibility
      if (!postData) {
        const { data: postById, error: errorById } = await supabase
          .from('posts')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        
        postData = postById;
        postError = errorById;
      }

      if (postError) throw postError;
      if (!postData) return null;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url, bio')
        .eq('user_id', postData.user_id)
        .maybeSingle();

      return {
        ...postData,
        authorProfile: profileData
      };
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['relatedPosts', post?.category, slug],
    queryFn: async () => {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, created_at, user_id')
        .eq('status', 'published')
        .neq('id', slug)
        .limit(3);

      if (postsError) throw postsError;
      if (!postsData) return [];

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return postsData.map(p => ({
        ...p,
        authorProfile: profileMap.get(p.user_id) || null
      }));
    },
    enabled: !!post,
  });

  const { comments, isLoading: commentsLoading, addComment, addVoiceComment, isAddingComment } = useComments(slug || '');
  const { isLiked, toggleLike } = useLikePost(slug || '');

  const handleVoiceNoteReady = (audioUrl: string, transcription: string) => {
    addVoiceComment(audioUrl, transcription);
    setIsRecordingMode(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    addComment(newComment);
    setNewComment('');
  };

  const calculateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (postLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading article...</p>
          </div>
        </main>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Post not found</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to feed
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const authorProfile = post.authorProfile;
  
  // Extract first image for og:image
  const imageMatch = post.content.match(/!\[.*?\]\((.*?)\)/);
  const featuredImage = imageMatch ? imageMatch[1] : 'https://lovable.dev/opengraph-image-p98pqg.png';
  
  // Generate SEO-friendly description (first 160 chars of content without markdown)
  const seoDescription = post.content
    .replace(/!\[.*?\]\([^)]+\)/g, '') // Remove images
    .replace(/[#*`>\[\]]/g, '') // Remove markdown syntax
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 160) + (post.content.length > 160 ? '...' : '');
  
  // Canonical URL using slug
  const canonicalUrl = `${window.location.origin}/article/${post.slug}`;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.title} | Basic Comet</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={featuredImage} />
        <meta property="og:site_name" content="Basic Comet" />
        <meta property="article:published_time" content={post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content={authorProfile?.display_name || 'Unknown'} />
        {post.category && <meta property="article:section" content={post.category} />}
        {post.tags?.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={featuredImage} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": seoDescription,
            "image": featuredImage,
            "datePublished": post.created_at,
            "dateModified": post.updated_at,
            "author": {
              "@type": "Person",
              "name": authorProfile?.display_name || 'Unknown',
              "url": `${window.location.origin}/profile/${authorProfile?.username}`
            },
            "publisher": {
              "@type": "Organization",
              "name": "Basic Comet",
              "url": window.location.origin
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrl
            },
            "articleSection": post.category || "General",
            "keywords": post.tags?.join(", ") || ""
          })}
        </script>
      </Helmet>
      
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-20 pb-20">
        {/* Hero Section with Category & Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="border-b border-white/10 bg-white/5 dark:bg-white/5 backdrop-blur-xl"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Back Button */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to feed</span>
            </Link>

            {/* Category */}
            {post.category && (
              <div className="mb-4">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  {post.category}
                </span>
              </div>
            )}
            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6 text-balance"
            >
              {post.title}
            </motion.h1>

            {/* Author & Meta Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 sm:gap-6"
            >
              <Link
                to={`/profile/${authorProfile?.username || 'unknown'}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="w-12 h-12 border-2 border-border group-hover:border-primary transition-colors">
                  <AvatarImage 
                    src={authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                    alt={authorProfile?.display_name || 'Author'}
                  />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    {authorProfile?.display_name || 'Unknown Author'}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    @{authorProfile?.username || 'unknown'}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.created_at), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {calculateReadTime(post.content)}
                </span>
              </div>

              {user && user.id === post.user_id && (
                <Link to={`/create?edit=${post.id}`} className="ml-auto">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Edit className="w-4 h-4" />
                    Edit Post
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-12">
            {/* Article Content */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl"
            >
              {/* Featured Image - Extract first image from content */}
              {(() => {
                const imageMatch = post.content.match(/!\[.*?\]\((.*?)\)/);
                const featuredImage = imageMatch ? imageMatch[1] : null;
                // Remove first image from content to avoid duplication
                const contentWithoutFirstImage = featuredImage 
                  ? post.content.replace(/!\[.*?\]\(.*?\)/, '').trim()
                  : post.content;
                
                return (
                  <>
                    {featuredImage && (
                      <div className="mb-8 -mx-4 sm:mx-0">
                        <img 
                          src={featuredImage} 
                          alt="Featured"
                          className="w-full h-auto max-h-[500px] object-cover rounded-none sm:rounded-2xl"
                        />
                      </div>
                    )}

                    {/* Content Body - Clean professional layout */}
                    <div className="post-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({ children }) => {
                            // Check if paragraph only contains an image
                            const childArray = Array.isArray(children) ? children : [children];
                            const hasOnlyImage = childArray.length === 1 && 
                              typeof childArray[0] === 'object' && 
                              childArray[0]?.type === 'img';
                            
                            if (hasOnlyImage) {
                              return <>{children}</>;
                            }
                            
                            return (
                              <p className="text-[17px] leading-[1.8] text-foreground/90 mb-5 tracking-wide">
                                {children}
                              </p>
                            );
                          },
                          h1: ({ children }) => (
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-10 mb-5 leading-tight">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-8 mb-4 leading-tight border-b border-border pb-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-6 mb-3 leading-tight">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-base sm:text-lg font-semibold text-foreground mt-5 mb-2">
                              {children}
                            </h4>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-none space-y-3 my-5 pl-0">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal space-y-3 my-5 pl-6 marker:text-primary marker:font-semibold">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-[17px] leading-[1.7] text-foreground/90 pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                              {children}
                            </li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary bg-muted/30 px-5 py-4 my-6 rounded-r-lg italic text-foreground/80">
                              {children}
                            </blockquote>
                          ),
                          code: ({ className, children }) => {
                            const isBlock = className?.includes('language-');
                            if (isBlock) {
                              return (
                                <code className={`${className} block bg-secondary/80 border border-border rounded-lg p-5 my-5 overflow-x-auto text-sm font-mono leading-relaxed`}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code className="bg-secondary/80 text-primary px-2 py-1 rounded text-[15px] font-mono mx-0.5">
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="bg-secondary/80 border border-border rounded-lg p-5 my-5 overflow-x-auto text-sm">
                              {children}
                            </pre>
                          ),
                          a: ({ href, children }) => (
                            <a 
                              href={href} 
                              className="text-primary font-medium hover:underline underline-offset-2 transition-colors" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                          img: ({ src, alt }) => (
                            <figure className="my-8">
                              <img 
                                src={src} 
                                alt={alt || 'Image'} 
                                className="w-full h-auto rounded-xl max-h-[600px] object-cover shadow-sm"
                              />
                              {alt && alt !== 'Image' && (
                                <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
                                  {alt}
                                </figcaption>
                              )}
                            </figure>
                          ),
                          hr: () => (
                            <hr className="my-10 border-border" />
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-foreground">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-foreground/85">
                              {children}
                            </em>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-6">
                              <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-muted/50">
                              {children}
                            </thead>
                          ),
                          th: ({ children }) => (
                            <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border px-4 py-3 text-foreground/90">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {contentWithoutFirstImage}
                      </ReactMarkdown>
                    </div>
                  </>
                );
              })()}

              {/* Tags Section */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-10 pt-8 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-4 py-2 text-sm rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 text-foreground hover:bg-white/20 transition-all cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Bar */}
              <div className="mt-8 py-6 border-t border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      size="sm"
                      onClick={toggleLike}
                      className={`gap-2 backdrop-blur-sm ${isLiked ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes_count}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20">
                      <MessageCircle className="w-4 h-4" />
                      <span>{comments?.length || 0}</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShareDropdown title={post.title} url={window.location.href} />
                    <Button
                      variant={isBookmarked ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`backdrop-blur-sm ${isBookmarked ? '' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Comments
                  <span className="text-lg font-normal text-muted-foreground">
                    ({comments?.length || 0})
                  </span>
                </h2>

                {/* Add Comment */}
                {user ? (
                  <div className="mb-8 p-4 rounded-xl bg-white/10 dark:bg-white/10 backdrop-blur-lg border border-white/20">
                    <AnimatePresence mode="wait">
                      {isRecordingMode ? (
                        <motion.div
                          key="voice"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <VoiceRecorder
                            onVoiceNoteReady={handleVoiceNoteReady}
                            onCancel={() => setIsRecordingMode(false)}
                            isSubmitting={isAddingComment}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="text"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex gap-4"
                        >
                          <Avatar className="w-10 h-10 border border-border flex-shrink-0">
                            <AvatarImage 
                              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                              alt="Your avatar"
                            />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Share your thoughts..."
                              rows={3}
                              className="w-full bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none border border-white/20"
                            />
                            <div className="flex items-center justify-between">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setIsRecordingMode(true)}
                                className="gap-1.5"
                              >
                                <Mic className="w-4 h-4" />
                                Voice Note
                              </Button>
                              <Button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || isAddingComment}
                                size="sm"
                                className="gap-2"
                              >
                                {isAddingComment ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="mb-8 p-6 rounded-xl bg-white/10 dark:bg-white/10 backdrop-blur-lg border border-white/20 text-center">
                    <p className="text-muted-foreground mb-4">Sign in to join the conversation</p>
                    <Link to="/auth">
                      <Button>Sign In</Button>
                    </Link>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {commentsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments && comments.length > 0 ? (
                    comments.map((comment: any, index: number) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-4 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <Link to={`/profile/${comment.profile?.username || comment.profiles?.username || 'unknown'}`} className="flex-shrink-0">
                          <Avatar className="w-10 h-10 border border-border hover:border-primary transition-colors">
                            <AvatarImage 
                              src={comment.profile?.avatar_url || comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`}
                              alt={comment.profile?.display_name || comment.profiles?.display_name || 'User'}
                            />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              to={`/profile/${comment.profile?.username || comment.profiles?.username || 'unknown'}`}
                              className="font-semibold text-sm hover:text-primary transition-colors"
                            >
                              {comment.profile?.display_name || comment.profiles?.display_name || 'Unknown User'}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.is_voice_note && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                🎙️ Voice
                              </span>
                            )}
                          </div>
                          
                          {comment.is_voice_note && comment.audio_url ? (
                            <VoiceNotePlayer 
                              audioUrl={comment.audio_url} 
                              transcription={comment.transcription || comment.content} 
                            />
                          ) : (
                            <p className="text-sm text-foreground/85 leading-relaxed">
                              {comment.content}
                            </p>
                          )}
                          <button className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{comment.likes_count || 0} likes</span>
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-hide"
            >
              {/* Author Card */}
              <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl p-6 shadow-xl">
                <div className="text-center mb-4">
                  <Link to={`/profile/${authorProfile?.username || 'unknown'}`}>
                    <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-border hover:border-primary transition-colors">
                      <AvatarImage 
                        src={authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                        alt={authorProfile?.display_name || 'Author'}
                      />
                      <AvatarFallback>
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link
                    to={`/profile/${authorProfile?.username || 'unknown'}`}
                    className="block"
                  >
                    <h3 className="font-bold text-lg hover:text-primary transition-colors">
                      {authorProfile?.display_name || 'Unknown Author'}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      @{authorProfile?.username || 'unknown'}
                    </p>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-6 line-clamp-3">
                  {authorProfile?.bio || 'No bio available'}
                </p>
                <Button className="w-full" size="sm">
                  Follow
                </Button>
              </div>

              {/* Related Posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl p-6 shadow-xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    More to Read
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost: any) => {
                      const relatedProfile = relatedPost.authorProfile;
                      const readTime = `${Math.ceil(5 + Math.random() * 10)} min`;
                      
                      return (
                        <Link
                          key={relatedPost.id}
                          to={`/article/${relatedPost.id}`}
                          className="block group"
                        >
                          <div className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-white/10 transition-colors">
                            <Avatar className="w-8 h-8 border border-border flex-shrink-0">
                              <AvatarImage 
                                src={relatedProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${relatedPost.id}`}
                                alt={relatedProfile?.display_name || 'Author'}
                              />
                              <AvatarFallback>
                                <User className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                {relatedPost.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {relatedProfile?.display_name || 'Unknown'} · {readTime}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Topics */}
              {post.tags && post.tags.length > 0 && (
                <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl p-6 shadow-xl">
                  <h3 className="font-bold mb-4">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 text-sm rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-foreground hover:bg-white/20 transition-all cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Article;
