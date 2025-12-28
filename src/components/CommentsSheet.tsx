import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2, MessageCircle, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import MentionInput from './MentionInput';
import MentionText from './MentionText';
import VoiceRecorder from './VoiceRecorder';
import VoiceNotePlayer from './VoiceNotePlayer';

interface CommentsSheetProps {
  postId: string;
  postTitle: string;
  commentsCount: number;
}

const CommentsSheet = ({ postId, postTitle, commentsCount }: CommentsSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const { comments, isLoading, addComment, addVoiceComment, deleteComment, isAddingComment } = useComments(postId);
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(newComment);
    setNewComment('');
  };

  const handleVoiceNoteReady = (audioUrl: string, transcription: string) => {
    addVoiceComment(audioUrl, transcription);
    setIsRecordingMode(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{commentsCount}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-left">
            Comments
            <span className="text-muted-foreground font-normal text-sm ml-2">
              on "{postTitle.slice(0, 30)}{postTitle.length > 30 ? '...' : ''}"
            </span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 group"
                  >
                    <Link to={`/profile/${comment.profile?.username || 'user'}`}>
                      <img
                        src={comment.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`}
                        alt={comment.profile?.display_name || 'User'}
                        className="w-8 h-8 rounded-full border border-border"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${comment.profile?.username || 'user'}`}
                          className="font-medium text-sm hover:text-primary transition-colors"
                        >
                          {comment.profile?.display_name || 'Anonymous'}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.is_voice_note && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            🎙️ Voice
                          </span>
                        )}
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {comment.is_voice_note && comment.audio_url ? (
                        <div className="mt-2">
                          <VoiceNotePlayer 
                            audioUrl={comment.audio_url} 
                            transcription={comment.transcription || comment.content} 
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/90 mt-1 break-words">
                          <MentionText text={comment.content} />
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {user ? (
          <div className="mt-4 pt-4 border-t border-border">
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
                <motion.form
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSubmit}
                >
                  <div className="flex gap-2">
                    <MentionInput
                      value={newComment}
                      onChange={setNewComment}
                      placeholder="Write a comment... Use @username to mention"
                      minHeight="80px"
                      maxLength={1000}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs text-muted-foreground">
                        {newComment.length}/1000
                      </span>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim() || isAddingComment}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {isAddingComment ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">
                Sign in
              </Link>{' '}
              to join the conversation
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
