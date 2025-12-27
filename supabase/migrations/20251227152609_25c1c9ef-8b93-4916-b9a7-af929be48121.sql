-- Create function to notify group members when a new post is created
CREATE OR REPLACE FUNCTION public.create_group_post_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_record RECORD;
  group_name TEXT;
BEGIN
  -- Get the group name
  SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;
  
  -- Notify all members of the group except the post author
  FOR member_record IN 
    SELECT user_id FROM group_members 
    WHERE group_id = NEW.group_id AND user_id != NEW.user_id
  LOOP
    INSERT INTO notifications (user_id, type, actor_id, post_id)
    VALUES (member_record.user_id, 'group_post', NEW.user_id, NULL);
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for group post notifications
DROP TRIGGER IF EXISTS on_group_post_created ON group_posts;
CREATE TRIGGER on_group_post_created
  AFTER INSERT ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_group_post_notification();