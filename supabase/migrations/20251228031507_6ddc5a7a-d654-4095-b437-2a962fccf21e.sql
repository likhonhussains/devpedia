-- Create group_post_likes table
CREATE TABLE public.group_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_post_likes
CREATE POLICY "Users can view likes on group posts they can access"
ON public.group_post_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_posts gp
    JOIN groups g ON g.id = gp.group_id
    WHERE gp.id = group_post_likes.post_id
    AND (g.privacy = 'public' OR is_group_member(g.id, auth.uid()))
  )
);

CREATE POLICY "Group members can like posts"
ON public.group_post_likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM group_posts gp
    WHERE gp.id = group_post_likes.post_id
    AND is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Users can remove their own likes"
ON public.group_post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Functions to increment/decrement group post likes
CREATE OR REPLACE FUNCTION public.increment_group_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE group_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_group_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE group_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_post_id;
END;
$$;

-- Functions to increment/decrement group post comments
CREATE OR REPLACE FUNCTION public.increment_group_post_comments(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE group_posts SET comments_count = comments_count + 1 WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_group_post_comments(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE group_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = p_post_id;
END;
$$;