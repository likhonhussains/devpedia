import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, 
  Eye, 
  Edit3, 
  Image, 
  Link as LinkIcon, 
  Code, 
  Bold, 
  Italic,
  List,
  ListOrdered,
  Quote,
  Hash,
  X,
  FileText,
  StickyNote,
  Video,
  Send,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';
import { categoryOptions } from '@/components/CategoryFilter';

const contentTypes = [
  { id: 'post', label: 'Post', icon: FileText, description: 'Long-form article with full markdown support' },
  { id: 'note', label: 'Note', icon: StickyNote, description: 'Quick tip or short snippet' },
  { id: 'video', label: 'Video', icon: Video, description: 'Share a video with description' },
];

const popularTags = [
  'react', 'typescript', 'javascript', 'nextjs', 'nodejs', 'python',
  'rust', 'webdev', 'devops', 'tutorial', 'tips', 'career'
];

const CreatePost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [contentType, setContentType] = useState('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);

  // Load draft if editing
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId || !user) return;

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .maybeSingle();

      if (error || !data) {
        toast({
          title: 'Draft not found',
          description: 'The draft you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/create');
        return;
      }

      setContentType(data.type);
      setTitle(data.title);
      setContent(data.content);
      setVideoUrl(data.video_url || '');
      setSelectedTags(data.tags || []);
      setSelectedCategory(data.category || 'general');
      setCurrentDraftId(data.id);
    };

    loadDraft();
  }, [draftId, user, navigate, toast]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create content.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [user, loading, navigate, toast]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = customTag.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTag('');
    }
  };

  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    
    let newText = '';
    let cursorOffset = 0;

    switch (syntax) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'code':
        newText = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText}\n\`\`\``
          : `\`${selectedText}\``;
        cursorOffset = selectedText.includes('\n') ? 4 : 1;
        break;
      case 'link':
        newText = `[${selectedText}](url)`;
        cursorOffset = 1;
        break;
      case 'image':
        newText = `![${selectedText}](image-url)`;
        cursorOffset = 2;
        break;
      case 'quote':
        newText = `> ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'ul':
        newText = `- ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'ol':
        newText = `1. ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'h2':
        newText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      default:
        newText = selectedText;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cursorOffset + (selectedText === placeholder ? 0 : selectedText.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save drafts.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!title.trim() && !content.trim()) {
      toast({
        title: "Content required",
        description: "Please add a title or content before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDraft(true);

    try {
      if (currentDraftId) {
        // Update existing draft
        const { error } = await supabase
          .from('posts')
          .update({
            type: contentType,
            title: title.trim() || 'Untitled Draft',
            content: content.trim(),
            video_url: contentType === 'video' ? videoUrl.trim() : null,
            tags: selectedTags,
            category: selectedCategory,
            status: 'draft',
          })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            type: contentType,
            title: title.trim() || 'Untitled Draft',
            content: content.trim(),
            video_url: contentType === 'video' ? videoUrl.trim() : null,
            tags: selectedTags,
            category: selectedCategory,
            status: 'draft',
          })
          .select('id')
          .single();

        if (error) throw error;
        setCurrentDraftId(data.id);
      }

      toast({
        title: "Draft saved!",
        description: "Your draft has been saved. You can continue editing later.",
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Failed to save draft",
        description: error.message || "An error occurred while saving your draft.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create content.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your post.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your post.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTags.length === 0) {
      toast({
        title: "Tags required",
        description: "Please select at least one tag.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      if (currentDraftId) {
        // Update draft to published
        const { error } = await supabase
          .from('posts')
          .update({
            type: contentType,
            title: title.trim(),
            content: content.trim(),
            video_url: contentType === 'video' ? videoUrl.trim() : null,
            tags: selectedTags,
            category: selectedCategory,
            status: 'published',
          })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        // Create new published post
        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          type: contentType,
          title: title.trim(),
          content: content.trim(),
          video_url: contentType === 'video' ? videoUrl.trim() : null,
          tags: selectedTags,
          category: selectedCategory,
          status: 'published',
        });

        if (error) throw error;
      }

      toast({
        title: "Post published!",
        description: "Your post is now live and visible to the community.",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error publishing post:', error);
      toast({
        title: "Failed to publish",
        description: error.message || "An error occurred while publishing your post.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold mb-2">Create New Content</h1>
            <p className="text-muted-foreground">Share your knowledge with the community</p>
          </motion.div>

          {/* Content Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            {contentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = contentType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`p-4 rounded-xl text-left transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary/10 border-2 border-primary glow-border'
                      : 'glass-card hover:border-primary/30'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className={`font-semibold mb-1 ${isSelected ? 'text-primary' : ''}`}>{type.label}</h3>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              );
            })}
          </motion.div>

          {/* Category Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass-card rounded-xl p-6 mb-6"
          >
            <h3 className="font-semibold mb-4">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-2xl overflow-hidden mb-6"
          >
            {/* Title Input */}
            <div className="p-6 border-b border-border">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a compelling title..."
                maxLength={150}
                className="w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground focus:outline-none"
              />
              <p className="text-xs text-muted-foreground mt-2">{title.length}/150 characters</p>
            </div>

            {/* Video URL (for video type) */}
            {contentType === 'video' && (
              <div className="p-6 border-b border-border">
                <label className="text-sm text-muted-foreground mb-2 block">Video URL</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-secondary rounded-lg px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-3 border-b border-border bg-secondary/30 overflow-x-auto">
              <button
                onClick={() => insertMarkdown('bold', 'bold text')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown('italic', 'italic text')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => insertMarkdown('h2', 'Heading')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Heading"
              >
                <Hash className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown('quote', 'quote')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown('code', 'code')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Code"
              >
                <Code className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => insertMarkdown('ul', 'list item')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown('ol', 'list item')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => insertMarkdown('link', 'link text')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown('image', 'alt text')}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Image"
              >
                <Image className="w-4 h-4" />
              </button>

              <div className="flex-1" />

              {/* Preview Toggle */}
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isPreview ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
                }`}
              >
                {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{isPreview ? 'Edit' : 'Preview'}</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {isPreview ? (
                <div className="p-6 prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">Nothing to preview yet...</p>
                  )}
                </div>
              ) : (
                <textarea
                  id="content-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={contentType === 'note' 
                    ? "Write your quick tip or snippet..."
                    : "Write your content using Markdown...\n\n## Example Heading\n\nYou can use **bold**, *italic*, and `code` formatting.\n\n- Bullet points\n- Are supported\n\n> And blockquotes too!"
                  }
                  className="w-full h-[400px] bg-transparent p-6 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-mono text-sm leading-relaxed"
                />
              )}
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-xl p-6 mb-6"
          >
            <h3 className="font-semibold mb-4">Tags (select up to 5)</h3>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-mono"
                  >
                    #{tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Popular Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {popularTags.filter(t => !selectedTags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  disabled={selectedTags.length >= 5}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-sm font-mono hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Custom Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                placeholder="Add custom tag..."
                maxLength={20}
                className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomTag}
                disabled={!customTag.trim() || selectedTags.length >= 5}
              >
                Add
              </Button>
            </div>
          </motion.div>

          {/* Publish Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {content.length} characters · {content.split(/\s+/).filter(Boolean).length} words
              </p>
              {currentDraftId && (
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  Editing draft
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isPublishing}
                className="gap-2"
              >
                {isSavingDraft ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || isSavingDraft}
                className="gap-2"
              >
                {isPublishing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
