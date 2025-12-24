import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/useComments';
import { useLikePost } from '@/hooks/useLikePost';
import { formatDistanceToNow, format } from 'date-fns';

const Article = () => {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Fetch post data from database
  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      // First get the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', slug)
        .maybeSingle();

      if (postError) throw postError;
      if (!postData) return null;

      // Then get the author profile
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

      // Get profiles for each post
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

  // Use comments hook
  const { comments, isLoading: commentsLoading, addComment, isAddingComment } = useComments(slug || '');

  // Use like hook
  const { isLiked, toggleLike } = useLikePost(slug || '');

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    addComment(newComment);
    setNewComment('');
  };

  // Calculate read time (rough estimate: 200 words per minute)
  const calculateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (postLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to feed
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const authorProfile = post.authorProfile;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
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

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Main Content */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* Article Header */}
              <div className="p-6 md:p-8 border-b border-border">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-6">
                  {post.title}
                </h1>

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to={`/profile/${authorProfile?.username || 'unknown'}`}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                      alt={authorProfile?.display_name || 'Author'}
                      className="w-12 h-12 rounded-full border-2 border-border group-hover:border-primary transition-colors"
                    />
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {authorProfile?.display_name || 'Unknown Author'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {authorProfile?.bio || ''}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(post.created_at), 'MMMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {calculateReadTime(post.content)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6 md:p-8">
                <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-secondary prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {post.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Article Actions */}
              <div className="p-6 md:p-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleLike}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isLiked
                          ? 'bg-red-500/10 text-red-500'
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likes_count + (isLiked ? 0 : 0)}</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{comments?.length || 0}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-6 md:p-8 border-t border-border">
                <h2 className="text-xl font-semibold mb-6">
                  Comments ({comments?.length || 0})
                </h2>

                {/* Add Comment */}
                {user ? (
                  <div className="flex gap-3 mb-8">
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                    />
                    <div className="flex-1 relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full bg-secondary rounded-xl p-4 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isAddingComment}
                        className="absolute right-3 bottom-3 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAddingComment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-secondary rounded-xl text-center">
                    <p className="text-muted-foreground mb-2">Sign in to leave a comment</p>
                    <Link to="/auth">
                      <Button size="sm">Sign In</Button>
                    </Link>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {commentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments && comments.length > 0 ? (
                    comments.map((comment: any, index: number) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3"
                      >
                        <Link to={`/profile/${comment.profiles?.username || 'unknown'}`} className="flex-shrink-0">
                          <img
                            src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`}
                            alt={comment.profiles?.display_name || 'User'}
                            className="w-10 h-10 rounded-full border-2 border-border hover:border-primary transition-colors"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              to={`/profile/${comment.profiles?.username || 'unknown'}`}
                              className="font-medium text-sm hover:text-primary transition-colors"
                            >
                              {comment.profiles?.display_name || 'Unknown User'}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/85 leading-relaxed">
                            {comment.content}
                          </p>
                          <button className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{comment.likes_count || 0}</span>
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            </motion.article>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Author Card */}
              <div className="glass-card rounded-xl p-5">
                <Link
                  to={`/profile/${authorProfile?.username || 'unknown'}`}
                  className="flex items-center gap-3 mb-4 group"
                >
                  <img
                    src={authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                    alt={authorProfile?.display_name || 'Author'}
                    className="w-14 h-14 rounded-full border-2 border-border group-hover:border-primary transition-colors"
                  />
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {authorProfile?.display_name || 'Unknown Author'}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      @{authorProfile?.username || 'unknown'}
                    </p>
                  </div>
                </Link>
                <p className="text-sm text-muted-foreground mb-4">
                  {authorProfile?.bio || 'No bio available'}
                </p>
                <Button className="w-full" size="sm">
                  Follow
                </Button>
              </div>

              {/* Related Posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div className="glass-card rounded-xl p-5">
                  <h3 className="font-semibold mb-4">Related Posts</h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost: any) => {
                      const relatedProfile = relatedPost.authorProfile;
                      const readTime = `${Math.ceil(5 + Math.random() * 10)} min read`;
                      
                      return (
                        <Link
                          key={relatedPost.id}
                          to={`/article/${relatedPost.id}`}
                          className="block group"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={relatedProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${relatedPost.id}`}
                              alt={relatedProfile?.display_name || 'Author'}
                              className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
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

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="glass-card rounded-xl p-5">
                  <h3 className="font-semibold mb-4">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 text-sm rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
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
