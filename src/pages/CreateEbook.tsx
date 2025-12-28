import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Trash2, GripVertical, Upload, Save, Send, Loader2 } from 'lucide-react';
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
import { GENRE_LABELS, EbookGenre } from '@/hooks/useEbooks';

interface ChapterDraft {
  id: string;
  title: string;
  content: string;
  order: number;
}

const CreateEbook = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<EbookGenre>('other');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { id: crypto.randomUUID(), title: '', content: '', order: 1 }
  ]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Cover image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('ebook-covers')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload cover image',
        variant: 'destructive',
      });
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ebook-covers')
      .getPublicUrl(fileName);

    setCoverUrl(publicUrl);
    setCoverPreview(URL.createObjectURL(file));
    setIsUploading(false);
  };

  const addChapter = () => {
    const newChapter: ChapterDraft = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order: chapters.length + 1,
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(chapters.length);
  };

  const removeChapter = (index: number) => {
    if (chapters.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'You need at least one chapter',
        variant: 'destructive',
      });
      return;
    }
    
    const newChapters = chapters.filter((_, i) => i !== index).map((ch, i) => ({
      ...ch,
      order: i + 1,
    }));
    setChapters(newChapters);
    if (activeChapter >= newChapters.length) {
      setActiveChapter(newChapters.length - 1);
    }
  };

  const updateChapter = (index: number, field: 'title' | 'content', value: string) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapters(newChapters);
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your eBook',
        variant: 'destructive',
      });
      return false;
    }

    const hasEmptyChapter = chapters.some(ch => !ch.title.trim() || !ch.content.trim());
    if (hasEmptyChapter) {
      toast({
        title: 'Incomplete chapters',
        description: 'Please fill in all chapter titles and content',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const saveEbook = async (publish: boolean) => {
    if (!user) return;
    if (!validateForm()) return;

    const setLoading = publish ? setIsPublishing : setIsSaving;
    setLoading(true);

    // Create ebook
    const { data: ebook, error: ebookError } = await supabase
      .from('ebooks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        cover_url: coverUrl || null,
        genre,
        status: publish ? 'published' : 'draft',
      })
      .select()
      .single();

    if (ebookError || !ebook) {
      toast({
        title: 'Error',
        description: 'Could not create eBook',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Create chapters
    const { error: chaptersError } = await supabase
      .from('ebook_chapters')
      .insert(
        chapters.map(ch => ({
          ebook_id: ebook.id,
          title: ch.title.trim(),
          content: ch.content,
          chapter_order: ch.order,
        }))
      );

    if (chaptersError) {
      toast({
        title: 'Error',
        description: 'Could not create chapters',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: publish ? 'Published!' : 'Saved!',
      description: publish ? 'Your eBook is now live' : 'Your eBook has been saved as draft',
    });

    navigate(`/ebooks/${ebook.id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-2xl font-bold mb-2">Sign in to publish</h1>
            <p className="text-muted-foreground mb-6">You need to be signed in to publish an eBook</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
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
                <h1 className="text-2xl font-bold">Create eBook</h1>
                <p className="text-muted-foreground">Share your knowledge with the community</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Left: Details */}
              <div className="space-y-6">
                {/* Cover Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Cover Image</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCoverUpload}
                    accept="image/*"
                    className="hidden"
                  />
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

                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    placeholder="Enter eBook title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="What is your eBook about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre *</label>
                  <Select value={genre} onValueChange={(v) => setGenre(v as EbookGenre)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right: Chapters */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Chapters</h2>
                  <Button variant="outline" size="sm" onClick={addChapter}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chapter
                  </Button>
                </div>

                <Tabs value={String(activeChapter)} onValueChange={(v) => setActiveChapter(Number(v))}>
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
                    {chapters.map((chapter, index) => (
                      <TabsTrigger
                        key={chapter.id}
                        value={String(index)}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Ch. {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {chapters.map((chapter, index) => (
                    <TabsContent key={chapter.id} value={String(index)} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Chapter title..."
                          value={chapter.title}
                          onChange={(e) => updateChapter(index, 'title', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChapter(index)}
                          className="text-destructive hover:text-destructive"
                        >
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
                      <p className="text-xs text-muted-foreground">
                        Tip: You can use Markdown for formatting (headers, lists, bold, italic, etc.)
                      </p>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => saveEbook(false)}
                disabled={isSaving || isPublishing}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save as Draft
              </Button>
              <Button
                onClick={() => saveEbook(true)}
                disabled={isSaving || isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Publish
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreateEbook;
