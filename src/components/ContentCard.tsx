import { motion } from 'framer-motion';
import { Heart, Share2, Bookmark, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLikePost } from '@/hooks/useLikePost';
import { cn } from '@/lib/utils';
import CommentsSheet from './CommentsSheet';

interface ContentCardProps {
  id: string;
  type: 'post' | 'note' | 'video';
  title: string;
  author: string;
  authorAvatar: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  thumbnail?: string;
  tags?: string[];
}

const ContentCard = ({
  id,
  type,
  title,
  author,
  authorAvatar,
  content,
  likes,
  comments,
  timestamp,
  thumbnail,
  tags = [],
}: ContentCardProps) => {
  const { isLiked, isLoading, toggleLike } = useLikePost(id);
  // Generate username from author name
  const username = author.toLowerCase().replace(/\s+/g, '');
  // Generate slug from title
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="content-card"
    >
      {/* Video Thumbnail */}
      {type === 'video' && thumbnail && (
        <div className="relative mb-4 rounded-lg overflow-hidden group">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-xs font-mono">
            12:34
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${username}`} className="flex-shrink-0">
          <img
            src={authorAvatar}
            alt={author}
            className="w-10 h-10 rounded-full border-2 border-border hover:border-primary transition-colors"
          />
        </Link>
        <div>
          <Link
            to={`/profile/${username}`}
            className="font-medium text-sm hover:text-primary transition-colors"
          >
            {author}
          </Link>
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        </div>
        {type === 'note' && (
          <span className="ml-auto px-2 py-1 text-xs rounded-md bg-accent/20 text-accent font-mono">
            NOTE
          </span>
        )}
      </div>

      {/* Content */}
      <Link to={`/article/${slug}`}>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
          {title}
        </h3>
      </Link>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{content}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-md bg-secondary text-muted-foreground font-mono hover:text-primary transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <button
          onClick={toggleLike}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          <span className="text-xs font-medium">{likes}</span>
        </button>
        <CommentsSheet postId={id} postTitle={title} commentsCount={comments} />
        <button className="text-muted-foreground hover:text-foreground transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
    </motion.article>
  );
};

export default ContentCard;
