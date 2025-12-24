-- Add a trigger for mention notifications
CREATE OR REPLACE FUNCTION public.create_mention_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id UUID;
  mention_match TEXT;
BEGIN
  -- Extract @mentions from content
  FOR mention_match IN 
    SELECT DISTINCT (regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    mentioned_username := mention_match;
    
    -- Find the user ID for this username
    SELECT user_id INTO mentioned_user_id
    FROM profiles
    WHERE LOWER(username) = LOWER(mentioned_username);
    
    -- Create notification if user exists and is not the author
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id)
      VALUES (
        mentioned_user_id, 
        'mention', 
        NEW.user_id, 
        CASE WHEN TG_TABLE_NAME = 'posts' THEN NEW.id ELSE NEW.post_id END,
        CASE WHEN TG_TABLE_NAME = 'comments' THEN NEW.id ELSE NULL END
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for post mentions
CREATE TRIGGER on_post_mention_created
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_mention_notification();

-- Create trigger for comment mentions
CREATE TRIGGER on_comment_mention_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_mention_notification();