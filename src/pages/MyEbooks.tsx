import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Eye, Heart, Star, Edit, Trash2, MoreVertical, FileText, Clock, CheckCircle, Archive } from 'lucide-react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMyEbooks, GENRE_LABELS, EbookGenre, Ebook } from '@/hooks/useEbooks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    published: { icon: CheckCircle, label: 'Published', className: 'bg-green-500/20 text-green-400' },
    draft: { icon: Clock, label: 'Draft', className: 'bg-yellow-500/20 text-yellow-400' },
    archived: { icon: Archive, label: 'Archived', className: 'bg-muted text-muted-foreground' },
  };
  
  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.draft;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const EbookCard = ({ 
  ebook, 
  onDelete, 
  onPublish, 
  onUnpublish 
}: { 
  ebook: Ebook; 
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
}) => {
  const isPdf = !!ebook.pdf_url;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden group"
    >
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
          {ebook.cover_url ? (
            <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isPdf ? (
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              ) : (
                <BookOpen className="w-8 h-8 text-muted-foreground/50" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">{ebook.title}</h3>
              <p className="text-sm text-muted-foreground">
                {GENRE_LABELS[ebook.genre as EbookGenre]}
                {isPdf && <span className="ml-2 text-primary">• PDF</span>}
                {!isPdf && ebook.chapters_count !== undefined && (
                  <span className="ml-2">• {ebook.chapters_count} chapters</span>
                )}
              </p>
            </div>
            <StatusBadge status={ebook.status} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {ebook.views_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {ebook.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {ebook.average_rating?.toFixed(1) || '0.0'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/ebooks/${ebook.id}`}>
                <Eye className="w-4 h-4 mr-1" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/ebooks/${ebook.id}/edit`}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ebook.status === 'draft' ? (
                  <DropdownMenuItem onClick={() => onPublish(ebook.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onUnpublish(ebook.id)}>
                    <Clock className="w-4 h-4 mr-2" />
                    Unpublish
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(ebook.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MyEbooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { ebooks, loading, refetch } = useMyEbooks();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const publishedEbooks = ebooks.filter(e => e.status === 'published');
  const draftEbooks = ebooks.filter(e => e.status === 'draft');

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    
    // Delete chapters first
    await supabase.from('ebook_chapters').delete().eq('ebook_id', deleteId);
    // Delete reviews
    await supabase.from('ebook_reviews').delete().eq('ebook_id', deleteId);
    // Delete likes
    await supabase.from('ebook_likes').delete().eq('ebook_id', deleteId);
    // Delete bookmarks
    await supabase.from('ebook_bookmarks').delete().eq('ebook_id', deleteId);
    // Delete the ebook
    const { error } = await supabase.from('ebooks').delete().eq('id', deleteId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Could not delete eBook',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Your eBook has been deleted',
      });
      refetch();
    }
    
    setIsDeleting(false);
    setDeleteId(null);
  };

  const handlePublish = async (id: string) => {
    const { error } = await supabase
      .from('ebooks')
      .update({ status: 'published' })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Could not publish eBook', variant: 'destructive' });
    } else {
      toast({ title: 'Published', description: 'Your eBook is now live' });
      refetch();
    }
  };

  const handleUnpublish = async (id: string) => {
    const { error } = await supabase
      .from('ebooks')
      .update({ status: 'draft' })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Could not unpublish eBook', variant: 'destructive' });
    } else {
      toast({ title: 'Unpublished', description: 'Your eBook is now a draft' });
      refetch();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your eBooks</h1>
            <p className="text-muted-foreground mb-6">You need to be signed in to manage your eBooks</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
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
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold">My eBooks</h1>
              <p className="text-muted-foreground">Manage your published and draft eBooks</p>
            </div>
            <Button asChild>
              <Link to="/ebooks/create">
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Link>
            </Button>
          </motion.div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse glass-card rounded-xl p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-28 bg-secondary rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-secondary rounded w-1/2" />
                      <div className="h-4 bg-secondary rounded w-1/3" />
                      <div className="h-4 bg-secondary rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ebooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-12 text-center"
            >
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-2">No eBooks yet</h2>
              <p className="text-muted-foreground mb-6">Start sharing your knowledge by creating your first eBook</p>
              <Button asChild>
                <Link to="/ebooks/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First eBook
                </Link>
              </Button>
            </motion.div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({ebooks.length})</TabsTrigger>
                <TabsTrigger value="published">Published ({publishedEbooks.length})</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({draftEbooks.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6 space-y-4">
                {ebooks.map(ebook => (
                  <EbookCard 
                    key={ebook.id} 
                    ebook={ebook} 
                    onDelete={setDeleteId}
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                  />
                ))}
              </TabsContent>

              <TabsContent value="published" className="mt-6 space-y-4">
                {publishedEbooks.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                    No published eBooks yet
                  </div>
                ) : (
                  publishedEbooks.map(ebook => (
                    <EbookCard 
                      key={ebook.id} 
                      ebook={ebook} 
                      onDelete={setDeleteId}
                      onPublish={handlePublish}
                      onUnpublish={handleUnpublish}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="drafts" className="mt-6 space-y-4">
                {draftEbooks.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                    No draft eBooks
                  </div>
                ) : (
                  draftEbooks.map(ebook => (
                    <EbookCard 
                      key={ebook.id} 
                      ebook={ebook} 
                      onDelete={setDeleteId}
                      onPublish={handlePublish}
                      onUnpublish={handleUnpublish}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete eBook?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your eBook and all its chapters, reviews, and bookmarks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyEbooks;