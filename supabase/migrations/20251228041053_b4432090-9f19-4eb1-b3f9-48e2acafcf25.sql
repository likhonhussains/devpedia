-- Create ebook genres enum
CREATE TYPE public.ebook_genre AS ENUM (
  'fiction',
  'non_fiction',
  'technology',
  'science',
  'self_help',
  'business',
  'biography',
  'history',
  'fantasy',
  'mystery',
  'romance',
  'horror',
  'poetry',
  'education',
  'other'
);

-- Create ebook status enum
CREATE TYPE public.ebook_status AS ENUM ('draft', 'published', 'archived');

-- Create ebooks table
CREATE TABLE public.ebooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  genre ebook_genre NOT NULL DEFAULT 'other',
  status ebook_status NOT NULL DEFAULT 'draft',
  views_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  average_rating numeric(2,1) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ebook chapters table
CREATE TABLE public.ebook_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  chapter_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ebook reviews table
CREATE TABLE public.ebook_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ebook_id, user_id)
);

-- Create ebook bookmarks table
CREATE TABLE public.ebook_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ebook_id, user_id)
);

-- Create ebook likes table
CREATE TABLE public.ebook_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ebook_id, user_id)
);

-- Create ebook chapter comments table
CREATE TABLE public.ebook_chapter_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES public.ebook_chapters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_ebooks_user_id ON public.ebooks(user_id);
CREATE INDEX idx_ebooks_genre ON public.ebooks(genre);
CREATE INDEX idx_ebooks_status ON public.ebooks(status);
CREATE INDEX idx_ebook_chapters_ebook_id ON public.ebook_chapters(ebook_id);
CREATE INDEX idx_ebook_reviews_ebook_id ON public.ebook_reviews(ebook_id);
CREATE INDEX idx_ebook_bookmarks_user_id ON public.ebook_bookmarks(user_id);

-- Enable RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_chapter_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ebooks
CREATE POLICY "Published ebooks are viewable by everyone"
ON public.ebooks FOR SELECT
USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own ebooks"
ON public.ebooks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ebooks"
ON public.ebooks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ebooks"
ON public.ebooks FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for ebook_chapters
CREATE POLICY "Chapters viewable if ebook is viewable"
ON public.ebook_chapters FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ebooks 
  WHERE id = ebook_chapters.ebook_id 
  AND (status = 'published' OR user_id = auth.uid())
));

CREATE POLICY "Users can manage chapters of their ebooks"
ON public.ebook_chapters FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ebooks 
  WHERE id = ebook_chapters.ebook_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their ebook chapters"
ON public.ebook_chapters FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.ebooks 
  WHERE id = ebook_chapters.ebook_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete their ebook chapters"
ON public.ebook_chapters FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.ebooks 
  WHERE id = ebook_chapters.ebook_id AND user_id = auth.uid()
));

-- RLS Policies for ebook_reviews
CREATE POLICY "Reviews are viewable by everyone"
ON public.ebook_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.ebook_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.ebook_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.ebook_reviews FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for ebook_bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.ebook_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
ON public.ebook_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their bookmarks"
ON public.ebook_bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for ebook_likes
CREATE POLICY "Likes are viewable by everyone"
ON public.ebook_likes FOR SELECT
USING (true);

CREATE POLICY "Users can create likes"
ON public.ebook_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their likes"
ON public.ebook_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for ebook_chapter_comments
CREATE POLICY "Chapter comments are viewable by everyone"
ON public.ebook_chapter_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create chapter comments"
ON public.ebook_chapter_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chapter comments"
ON public.ebook_chapter_comments FOR DELETE
USING (auth.uid() = user_id);

-- Functions to update counts
CREATE OR REPLACE FUNCTION public.update_ebook_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE ebooks SET 
      reviews_count = (SELECT COUNT(*) FROM ebook_reviews WHERE ebook_id = NEW.ebook_id),
      average_rating = (SELECT COALESCE(AVG(rating), 0) FROM ebook_reviews WHERE ebook_id = NEW.ebook_id)
    WHERE id = NEW.ebook_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ebooks SET 
      reviews_count = (SELECT COUNT(*) FROM ebook_reviews WHERE ebook_id = OLD.ebook_id),
      average_rating = (SELECT COALESCE(AVG(rating), 0) FROM ebook_reviews WHERE ebook_id = OLD.ebook_id)
    WHERE id = OLD.ebook_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER update_ebook_review_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ebook_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_ebook_review_stats();

CREATE OR REPLACE FUNCTION public.increment_ebook_likes(p_ebook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ebooks SET likes_count = likes_count + 1 WHERE id = p_ebook_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_ebook_likes(p_ebook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ebooks SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_ebook_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ebook_views(p_ebook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ebooks SET views_count = views_count + 1 WHERE id = p_ebook_id;
END;
$$;

-- Create storage bucket for ebook covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ebook-covers', 'ebook-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ebook covers
CREATE POLICY "Ebook covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ebook-covers');

CREATE POLICY "Users can upload ebook covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ebook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their ebook covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ebook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their ebook covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'ebook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);