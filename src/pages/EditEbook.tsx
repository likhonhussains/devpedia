import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Plus, Trash2, Upload, Save, Send, Loader2, FileText, X } from 'lucide-react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GENRE_LABELS, EbookGenre, useEbook } from '@/hooks/useEbooks';

type ContentType = 'chapters' | 'pdf';

interface ChapterDraft {
  id: string;
  title: string;
  content: string;
  order: number;
  isNew?: boolean;
}

const EditEbook = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { ebook, chapters: existingChapters, loading: loadingEbook } = useEbook(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<EbookGenre>('other');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [contentType, setContentType] = useState<ContentType>('chapters');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (ebook && !initialized) {
      setTitle(ebook.title);
      setDescription(ebook.description || '');
      setGenre(ebook.genre);
      setCoverUrl(ebook.cover_url || '');
      setCoverPreview(ebook.cover_url || '');
      
      if (ebook.pdf_url) {
        setContentType('pdf');
        setPdfUrl(ebook.pdf_url);
        setPdfName('Existing PDF');
      } else {
        setContentType('chapters');
      }
      
      setInitialized(true);
    }
  }, [ebook, initialized]);

  useEffect(() => {
    if (existingChapters.length > 0 && chapters.length === 0) {
      setChapters(existingChapters.map(ch => ({
        id: ch.id,
        title: ch.title,
        content: ch.content,
        order: ch.chapter_order,
      })));
    }
  }, [existingChapters]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Cover image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('ebook-covers').upload(fileName, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: 'Could not upload cover image', variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('ebook-covers').getPublicUrl(fileName);
    setCoverUrl(publicUrl);
    setCoverPreview(URL.createObjectURL(file));
    setIsUploading(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'PDF must be less than 50MB', variant: 'destructive' });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF file', variant: 'destructive' });
      return;
    }

    setIsUploadingPdf(true);
    const fileName = `${user.id}/${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage.from('ebook-pdfs').upload(fileName, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: 'Could not upload PDF file', variant: 'destructive' });
      setIsUploadingPdf(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('ebook-pdfs').getPublicUrl(fileName);
    setPdfUrl(publicUrl);
    setPdfName(file.name);
    setIsUploadingPdf(false);
    toast({ title: 'PDF uploaded', description: 'Your PDF has been uploaded successfully' });
  };

  const removePdf = () => {
    setPdfUrl('');
    setPdfName('');
  };

  const addChapter = () => {
    const newChapter: ChapterDraft = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order: chapters.length + 1,
      isNew: true,
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(chapters.length);
  };

  const removeChapter = (index: number) => {
    if (chapters.length === 1) {
      toast({ title: 'Cannot remove', description: 'You need at least one chapter', variant: 'destructive' });
      return;
    }
    const newChapters = chapters.filter((_, i) => i !== index).map((ch, i) => ({ ...ch, order: i + 1 }));
    setChapters(newChapters);
    if (activeChapter >= newChapters.length) setActiveChapter(newChapters.length - 1);
  };

  const updateChapter = (index: number, field: 'title' | 'content', value: string) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapters(newChapters);
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title for your eBook', variant: 'destructive' });
      return false;
    }

    if (contentType === 'pdf' && !pdfUrl) {
      toast({ title: 'PDF required', description: 'Please upload a PDF file', variant: 'destructive' });
      return false;
    }

    if (contentType === 'chapters') {
      const hasEmptyChapter = chapters.some(ch => !ch.title.trim() || !ch.content.trim());
      if (hasEmptyChapter) {
        toast({ title: 'Incomplete chapters', description: 'Please fill in all chapter titles and content', variant: 'destructive' });
        return false;
      }
    }

    return true;
  };

  const saveEbook = async (publish: boolean) => {
    if (!user || !id) return;
    if (!validateForm()) return;

    const setLoading = publish ? setIsPublishing : setIsSaving;
    setLoading(true);

    // Update ebook
    const { error: ebookError } = await supabase
      .from('ebooks')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        cover_url: coverUrl || null,
        pdf_url: contentType === 'pdf' ? pdfUrl : null,
        genre,
        status: publish ? 'published' : ebook?.status || 'draft',
      })
      .eq('id', id);

    if (ebookError) {
      toast({ title: 'Error', description: 'Could not update eBook', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Handle chapters
    if (contentType === 'chapters') {
      // Delete removed chapters
      const existingIds = existingChapters.map(ch => ch.id);
      const currentIds = chapters.filter(ch => !ch.isNew).map(ch => ch.id);
      const deletedIds = existingIds.filter(id => !currentIds.includes(id));
      
      if (deletedIds.length > 0) {
        await supabase.from('ebook_chapters').delete().in('id', deletedIds);
      }

      // Update existing chapters
      for (const chapter of chapters.filter(ch => !ch.isNew)) {
        await supabase
          .from('ebook_chapters')
          .update({
            title: chapter.title.trim(),
            content: chapter.content,
            chapter_order: chapter.order,
          })
          .eq('id', chapter.id);
      }

      // Insert new chapters
      const newChapters = chapters.filter(ch => ch.isNew);
      if (newChapters.length > 0) {
        await supabase.from('ebook_chapters').insert(
          newChapters.map(ch => ({
            ebook_id: id,
            title: ch.title.trim(),
            content: ch.content,
            chapter_order: ch.order,
          }))
        );
      }
    } else {
      // If switching to PDF, delete all chapters
      await supabase.from('ebook_chapters').delete().eq('ebook_id', id);
    }

    toast({
      title: publish ? 'Published!' : 'Saved!',
      description: publish ? 'Your eBook is now live' : 'Your changes have been saved',
    });

    navigate(`/ebooks/${id}`);
  };

  if (loadingEbook) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-secondary rounded w-48" />
              <div className="glass-card rounded-2xl p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <div className="aspect-[3/4] bg-secondary rounded-xl" />
                    <div className="h-10 bg-secondary rounded" />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="h-10 bg-secondary rounded" />
                    <div className="h-64 bg-secondary rounded" />
                  </div>
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
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-2xl font-bold mb-2">eBook not found</h1>
            <p className="text-muted-foreground mb-6">The eBook you're looking for doesn't exist</p>
            <Button asChild>
              <Link to="/my-ebooks">Back to My eBooks</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (ebook.user_id !== user?.id) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-2xl font-bold mb-2">Access denied</h1>
            <p className="text-muted-foreground mb-6">You can only edit your own eBooks</p>
            <Button asChild>
              <Link to="/ebooks">Browse eBooks</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const genres = Object.entries(GENRE_LABELS) as [EbookGenre, string][];

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to="/my-ebooks"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My eBooks</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Edit eBook</h1>
                <p className="text-muted-foreground">Update your eBook details and content</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Left: Details */}
              <div className="space-y-6">
                {/* Cover Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Cover Image</label>
                  <input type="file" ref={fileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center bg-secondary/30 overflow-hidden"
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload cover</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input placeholder="Enter eBook title..." value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea placeholder="What is your eBook about?" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Genre *</label>
                  <Select value={genre} onValueChange={(v) => setGenre(v as EbookGenre)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {genres.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right: Content */}
              <div className="md:col-span-2">
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Content Type</label>
                  <div className="flex gap-2">
                    <Button variant={contentType === 'chapters' ? 'default' : 'outline'} onClick={() => setContentType('chapters')} className="flex-1">
                      <BookOpen className="w-4 h-4 mr-2" />Write Chapters
                    </Button>
                    <Button variant={contentType === 'pdf' ? 'default' : 'outline'} onClick={() => setContentType('pdf')} className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />Upload PDF
                    </Button>
                  </div>
                </div>

                {contentType === 'pdf' ? (
                  <div className="space-y-4">
                    <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
                    {pdfUrl ? (
                      <div className="border border-border rounded-xl p-6 bg-secondary/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{pdfName}</p>
                              <p className="text-sm text-muted-foreground">PDF uploaded</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={removePdf} className="text-destructive hover:text-destructive">
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="mt-4">
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            Preview PDF →
                          </a>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={isUploadingPdf}
                        className="w-full py-16 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center bg-secondary/30"
                      >
                        {isUploadingPdf ? (
                          <>
                            <Loader2 className="w-12 h-12 mb-3 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">Uploading PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-12 h-12 mb-3 text-muted-foreground" />
                            <span className="text-lg font-medium mb-1">Upload PDF eBook</span>
                            <span className="text-sm text-muted-foreground">Click to browse</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Chapters</h2>
                      <Button variant="outline" size="sm" onClick={addChapter}>
                        <Plus className="w-4 h-4 mr-2" />Add Chapter
                      </Button>
                    </div>

                    {chapters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No chapters yet. Add your first chapter to get started.</p>
                        <Button variant="outline" className="mt-4" onClick={addChapter}>
                          <Plus className="w-4 h-4 mr-2" />Add Chapter
                        </Button>
                      </div>
                    ) : (
                      <Tabs value={String(activeChapter)} onValueChange={(v) => setActiveChapter(Number(v))}>
                        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
                          {chapters.map((chapter, index) => (
                            <TabsTrigger key={chapter.id} value={String(index)} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                              Ch. {index + 1}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {chapters.map((chapter, index) => (
                          <TabsContent key={chapter.id} value={String(index)} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Input placeholder="Chapter title..." value={chapter.title} onChange={(e) => updateChapter(index, 'title', e.target.value)} className="flex-1" />
                              <Button variant="ghost" size="icon" onClick={() => removeChapter(index)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Write your chapter content here... (Markdown supported)"
                              value={chapter.content}
                              onChange={(e) => updateChapter(index, 'content', e.target.value)}
                              rows={16}
                              className="font-mono text-sm"
                            />
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => saveEbook(false)} disabled={isSaving || isPublishing}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
              {ebook.status === 'draft' && (
                <Button onClick={() => saveEbook(true)} disabled={isSaving || isPublishing}>
                  {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Publish
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default EditEbook;