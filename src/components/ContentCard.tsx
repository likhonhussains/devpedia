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
  const username = author.toLowerCase().replace(/\s+/g, '');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl bg-card border border-border/50 p-5 transition-all duration-300 hover:border-border hover:shadow-elevated"
    >
      {/* Video Thumbnail */}
      {type === 'video' && thumbnail && (
        <div className="relative mb-4 rounded-lg overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-glow">
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-background/90 rounded text-xs font-mono text-foreground">
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
            className="w-8 h-8 rounded-full ring-1 ring-border transition-all hover:ring-primary/50"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${username}`}
            className="text-sm font-medium hover:text-primary transition-colors truncate block"
          >
            {author}
          </Link>
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        </div>
        {type === 'note' && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
            Note
          </span>
        )}
      </div>

      {/* Content */}
      <Link to={`/article/${slug}`} className="block group/title">
        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover/title:text-primary transition-colors">
          {title}
        </h3>
      </Link>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{content}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-border/50">
        <button
          onClick={toggleLike}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-sm",
            isLiked 
              ? "text-red-400 bg-red-500/10" 
              : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
          <span className="text-xs font-medium">{likes}</span>
        </button>
        
        <CommentsSheet postId={id} postTitle={title} commentsCount={comments} />
        
        <div className="flex-1" />
        
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.article>
  );
};

export default ContentCard;
