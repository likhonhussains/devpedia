import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Calendar,
  Clock,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';

// Mock article data
const articleData = {
  id: '1',
  slug: 'understanding-react-server-components',
  title: 'Understanding React Server Components: A Deep Dive',
  author: {
    name: 'Sarah Chen',
    username: 'sarahchen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Senior Frontend Engineer @TechCorp',
  },
  publishedAt: 'December 20, 2024',
  readTime: '8 min read',
  likes: 234,
  comments: 45,
  tags: ['react', 'nextjs', 'webdev', 'javascript'],
  content: `
React Server Components represent a fundamental shift in how we think about React applications. In this article, we'll explore what they are, why they matter, and how to use them effectively.

## What are React Server Components?

React Server Components (RSC) allow you to render components on the server, reducing the amount of JavaScript sent to the client. This leads to:

- **Faster initial page loads** - Less JavaScript to download and parse
- **Better SEO** - Content is rendered on the server
- **Direct backend access** - Query databases directly from components

## The Mental Model

Think of your React application as having two types of components:

\`\`\`tsx
// Server Component (default in Next.js 13+)
async function ArticleList() {
  const articles = await db.query('SELECT * FROM articles');
  return (
    <ul>
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </ul>
  );
}

// Client Component
'use client';
function LikeButton({ articleId }) {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'}
    </button>
  );
}
\`\`\`

## When to Use Server vs Client Components

| Use Server Components for: | Use Client Components for: |
|---------------------------|---------------------------|
| Fetching data | Adding interactivity |
| Accessing backend resources | Using browser APIs |
| Keeping sensitive info on server | Managing state |
| Reducing client bundle size | Using effects |

## Best Practices

1. **Start with Server Components** - They should be your default choice
2. **Push client boundaries down** - Keep client components as leaf nodes
3. **Avoid prop drilling** - Use composition patterns instead

> "The best code is no code at all. Server Components let us write less JavaScript while doing more." - Dan Abramov

## Conclusion

React Server Components are not just a performance optimization—they're a new way of thinking about React architecture. By understanding when to use server vs client components, you can build faster, more efficient applications.

---

*Thanks for reading! Follow me for more React content.*
  `,
};

const commentsData = [
  {
    id: '1',
    author: {
      name: 'Alex Rivera',
      username: 'alexrivera',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
    content: 'Great explanation! The mental model section really helped me understand the difference between server and client components.',
    timestamp: '2 hours ago',
    likes: 12,
  },
  {
    id: '2',
    author: {
      name: 'Emma Wilson',
      username: 'emmawilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    },
    content: 'The table comparing when to use each type is super helpful. Bookmarking this for future reference!',
    timestamp: '4 hours ago',
    likes: 8,
  },
  {
    id: '3',
    author: {
      name: 'Marcus Johnson',
      username: 'marcusjohnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    },
    content: 'Would love to see a follow-up article about streaming and Suspense with RSC. This was really well written!',
    timestamp: '6 hours ago',
    likes: 15,
  },
];

const relatedPosts = [
  {
    id: '2',
    slug: 'state-management-2024',
    title: 'State Management in 2024: What Actually Works',
    author: 'Sarah Chen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    readTime: '6 min read',
  },
  {
    id: '3',
    slug: 'typescript-patterns',
    title: 'TypeScript Patterns Every React Dev Should Know',
    author: 'Emma Wilson',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    readTime: '10 min read',
  },
  {
    id: '4',
    slug: 'nextjs-app-router',
    title: 'Migrating to Next.js App Router: A Complete Guide',
    author: 'Alex Rivera',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    readTime: '12 min read',
  },
];

const Article = () => {
  const { slug } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(commentsData);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        username: 'currentuser',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
      },
      content: newComment,
      timestamp: 'Just now',
      likes: 0,
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
  };

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
                <div className="flex flex-wrap gap-2 mb-4">
                  {articleData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-6">
                  {articleData.title}
                </h1>

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to={`/profile/${articleData.author.username}`}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={articleData.author.avatar}
                      alt={articleData.author.name}
                      className="w-12 h-12 rounded-full border-2 border-border group-hover:border-primary transition-colors"
                    />
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {articleData.author.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {articleData.author.bio}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {articleData.publishedAt}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {articleData.readTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6 md:p-8">
                <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-secondary prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {articleData.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Article Actions */}
              <div className="p-6 md:p-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isLiked
                          ? 'bg-red-500/10 text-red-500'
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{articleData.likes + (isLiked ? 1 : 0)}</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{comments.length}</span>
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
                  Comments ({comments.length})
                </h2>

                {/* Add Comment */}
                <div className="flex gap-3 mb-8">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser"
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
                      disabled={!newComment.trim()}
                      className="absolute right-3 bottom-3 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3"
                    >
                      <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-10 h-10 rounded-full border-2 border-border hover:border-primary transition-colors"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            to={`/profile/${comment.author.username}`}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            {comment.author.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed">
                          {comment.content}
                        </p>
                        <button className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{comment.likes}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
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
                  to={`/profile/${articleData.author.username}`}
                  className="flex items-center gap-3 mb-4 group"
                >
                  <img
                    src={articleData.author.avatar}
                    alt={articleData.author.name}
                    className="w-14 h-14 rounded-full border-2 border-border group-hover:border-primary transition-colors"
                  />
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {articleData.author.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      @{articleData.author.username}
                    </p>
                  </div>
                </Link>
                <p className="text-sm text-muted-foreground mb-4">
                  {articleData.author.bio}
                </p>
                <Button className="w-full" size="sm">
                  Follow
                </Button>
              </div>

              {/* Related Posts */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-4">Related Posts</h3>
                <div className="space-y-4">
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/article/${post.slug}`}
                      className="block group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={post.authorAvatar}
                          alt={post.author}
                          className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.author} · {post.readTime}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-4">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {articleData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Article;
