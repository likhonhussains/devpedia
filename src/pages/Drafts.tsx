import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, FileText, StickyNote, Video, Edit3, Trash2, Send, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Draft {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const Drafts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const fetchDrafts = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, type, category, tags, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load drafts.',
          variant: 'destructive',
        });
        return;
      }

      setDrafts(data || []);
      setIsLoading(false);
    };

    fetchDrafts();
  }, [user, loading, navigate, toast]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete draft.',
        variant: 'destructive',
      });
    } else {
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Draft deleted',
        description: 'Your draft has been permanently deleted.',
      });
    }

    setDeletingId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return StickyNote;
      case 'video':
        return Video;
      default:
        return FileText;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Your Drafts</h1>
            <p className="text-muted-foreground">Continue working on your unfinished posts</p>
          </motion.div>

          {/* Drafts List */}
          {drafts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center">
                <PenLine className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No drafts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start writing and save your work as a draft to continue later.
              </p>
              <Button asChild>
                <Link to="/create">
                  <PenLine className="w-4 h-4 mr-2" />
                  Create New Post
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft, index) => {
                const TypeIcon = getTypeIcon(draft.type);
                
                return (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <TypeIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate mb-1">
                        {draft.title || 'Untitled Draft'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {draft.content.slice(0, 100)}...
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="capitalize">{draft.type}</span>
                        <span>•</span>
                        <span>Updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}</span>
                        {draft.tags?.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{draft.tags.length} tags</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/create?draft=${draft.id}`)}
                        className="gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === draft.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete draft?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your draft.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(draft.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Drafts;
