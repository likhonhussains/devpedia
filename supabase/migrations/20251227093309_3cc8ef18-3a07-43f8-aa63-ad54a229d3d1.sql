-- Create enum for group member roles
CREATE TYPE public.group_role AS ENUM ('admin', 'moderator', 'member');

-- Create enum for group privacy
CREATE TYPE public.group_privacy AS ENUM ('public', 'private');

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  avatar_url TEXT,
  privacy group_privacy NOT NULL DEFAULT 'public',
  creator_id UUID NOT NULL,
  members_count INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group posts table (separate from main posts for better organization)
CREATE TABLE public.group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group post comments table
CREATE TABLE public.group_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_comments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is group member
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  )
$$;

-- Security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  )
$$;

-- RLS Policies for groups table
CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (privacy = 'public' OR is_group_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group admins can update their groups"
ON public.groups FOR UPDATE
USING (is_group_admin(id, auth.uid()));

CREATE POLICY "Group admins can delete their groups"
ON public.groups FOR DELETE
USING (is_group_admin(id, auth.uid()));

-- RLS Policies for group_members table
CREATE POLICY "Group members are viewable by members"
ON public.group_members FOR SELECT
USING (is_group_member(group_id, auth.uid()) OR 
       EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND privacy = 'public'));

CREATE POLICY "Group admins can add members"
ON public.group_members FOR INSERT
WITH CHECK (is_group_admin(group_id, auth.uid()) OR 
            (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND privacy = 'public')));

CREATE POLICY "Group admins can update member roles"
ON public.group_members FOR UPDATE
USING (is_group_admin(group_id, auth.uid()));

CREATE POLICY "Members can leave or admins can remove"
ON public.group_members FOR DELETE
USING (auth.uid() = user_id OR is_group_admin(group_id, auth.uid()));

-- RLS Policies for group_posts table
CREATE POLICY "Group posts viewable by members or public groups"
ON public.group_posts FOR SELECT
USING (is_group_member(group_id, auth.uid()) OR 
       EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND privacy = 'public'));

CREATE POLICY "Group members can create posts"
ON public.group_posts FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can update their own posts"
ON public.group_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts or admins can"
ON public.group_posts FOR DELETE
USING (auth.uid() = user_id OR is_group_admin(group_id, auth.uid()));

-- RLS Policies for group_comments table
CREATE POLICY "Group comments viewable by members"
ON public.group_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.group_posts gp 
  JOIN public.groups g ON g.id = gp.group_id 
  WHERE gp.id = post_id AND (g.privacy = 'public' OR is_group_member(g.id, auth.uid()))
));

CREATE POLICY "Group members can create comments"
ON public.group_comments FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.group_posts gp 
  WHERE gp.id = post_id AND is_group_member(gp.group_id, auth.uid())
));

CREATE POLICY "Users can delete their own comments"
ON public.group_comments FOR DELETE
USING (auth.uid() = user_id);

-- Function to increment group members count
CREATE OR REPLACE FUNCTION public.increment_group_members(p_group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE groups SET members_count = members_count + 1 WHERE id = p_group_id;
END;
$$;

-- Function to decrement group members count
CREATE OR REPLACE FUNCTION public.decrement_group_members(p_group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE groups SET members_count = GREATEST(members_count - 1, 0) WHERE id = p_group_id;
END;
$$;

-- Function to increment group posts count
CREATE OR REPLACE FUNCTION public.increment_group_posts(p_group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE groups SET posts_count = posts_count + 1 WHERE id = p_group_id;
END;
$$;

-- Function to decrement group posts count
CREATE OR REPLACE FUNCTION public.decrement_group_posts(p_group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE groups SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = p_group_id;
END;
$$;

-- Trigger to auto-add creator as admin when group is created
CREATE OR REPLACE FUNCTION public.add_group_creator_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_creator_as_admin();

-- Update timestamp trigger for groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for group_posts
CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON public.group_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();