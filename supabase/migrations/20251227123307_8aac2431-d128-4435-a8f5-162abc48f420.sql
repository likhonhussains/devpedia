-- Create a function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_group_admin_or_moderator(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role IN ('admin', 'moderator')
  )
$$;

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Users can delete their own posts or admins can" ON public.group_posts;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.group_comments;

-- Create updated policies that include moderators
CREATE POLICY "Users can delete their own posts or staff can"
ON public.group_posts FOR DELETE
USING (auth.uid() = user_id OR is_group_admin_or_moderator(group_id, auth.uid()));

CREATE POLICY "Users or staff can delete comments"
ON public.group_comments FOR DELETE
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = post_id AND is_group_admin_or_moderator(gp.group_id, auth.uid())
  )
);