-- Enable realtime for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Create function to increment comments count
CREATE OR REPLACE FUNCTION public.increment_post_comments(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = p_post_id;
END;
$$;

-- Create function to decrement comments count
CREATE OR REPLACE FUNCTION public.decrement_post_comments(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = p_post_id;
END;
$$;