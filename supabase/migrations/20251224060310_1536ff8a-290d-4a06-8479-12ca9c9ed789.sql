-- Create badges table to define available achievements
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table to track earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Badges are viewable by everyone
CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT
USING (true);

-- User badges are viewable by everyone
CREATE POLICY "User badges are viewable by everyone"
ON public.user_badges FOR SELECT
USING (true);

-- System can insert user badges (via triggers)
CREATE POLICY "System can insert user badges"
ON public.user_badges FOR INSERT
WITH CHECK (true);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value) VALUES
('First Post', 'Published your first post', 'pencil', 'posts', 1),
('Prolific Writer', 'Published 10 posts', 'book-open', 'posts', 10),
('Centurion', 'Published 100 posts', 'crown', 'posts', 100),
('Rising Star', 'Received 10 likes', 'star', 'likes_received', 10),
('Popular', 'Received 100 likes', 'heart', 'likes_received', 100),
('Superstar', 'Received 1000 likes', 'trophy', 'likes_received', 1000),
('Conversationalist', 'Posted 10 comments', 'message-circle', 'comments', 10),
('Social Butterfly', 'Following 10 users', 'users', 'following', 10),
('Influencer', 'Gained 10 followers', 'user-plus', 'followers', 10),
('Celebrity', 'Gained 100 followers', 'award', 'followers', 100);

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  user_value INTEGER;
BEGIN
  FOR badge_record IN SELECT * FROM badges LOOP
    -- Check if user already has this badge
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = badge_record.id) THEN
      CONTINUE;
    END IF;
    
    -- Get the user's current value for this criteria
    CASE badge_record.criteria_type
      WHEN 'posts' THEN
        SELECT COUNT(*) INTO user_value FROM posts WHERE user_id = p_user_id;
      WHEN 'likes_received' THEN
        SELECT COALESCE(SUM(likes_count), 0) INTO user_value FROM posts WHERE user_id = p_user_id;
      WHEN 'comments' THEN
        SELECT COUNT(*) INTO user_value FROM comments WHERE user_id = p_user_id;
      WHEN 'following' THEN
        SELECT COUNT(*) INTO user_value FROM followers WHERE follower_id = p_user_id;
      WHEN 'followers' THEN
        SELECT COUNT(*) INTO user_value FROM followers WHERE following_id = p_user_id;
      ELSE
        user_value := 0;
    END CASE;
    
    -- Award badge if criteria met
    IF user_value >= badge_record.criteria_value THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Create triggers to check badges on relevant actions
CREATE OR REPLACE FUNCTION public.trigger_check_badges_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_after_post
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION trigger_check_badges_on_post();

CREATE OR REPLACE FUNCTION public.trigger_check_badges_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_after_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION trigger_check_badges_on_comment();

CREATE OR REPLACE FUNCTION public.trigger_check_badges_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.follower_id);
  PERFORM check_and_award_badges(NEW.following_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_after_follow
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION trigger_check_badges_on_follow();

CREATE OR REPLACE FUNCTION public.trigger_check_badges_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  IF post_owner_id IS NOT NULL THEN
    PERFORM check_and_award_badges(post_owner_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_after_like
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION trigger_check_badges_on_like();