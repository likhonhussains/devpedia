-- Add category column to posts table
ALTER TABLE public.posts 
ADD COLUMN category TEXT DEFAULT 'general';

-- Create an index for faster category filtering
CREATE INDEX idx_posts_category ON public.posts(category);