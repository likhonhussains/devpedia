-- Add status column to posts table for draft functionality
ALTER TABLE public.posts 
ADD COLUMN status TEXT NOT NULL DEFAULT 'published' 
CHECK (status IN ('draft', 'published'));

-- Create index for faster status queries
CREATE INDEX idx_posts_status ON public.posts(status);

-- Update RLS policy to allow users to see their own drafts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

CREATE POLICY "Published posts are viewable by everyone"
ON public.posts FOR SELECT
USING (status = 'published' OR auth.uid() = user_id);