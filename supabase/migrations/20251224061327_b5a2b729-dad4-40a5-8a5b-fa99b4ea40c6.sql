-- Create trigger to notify users when they earn a badge
CREATE OR REPLACE FUNCTION public.create_badge_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.user_id, 'badge', NEW.user_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_badge_earned
AFTER INSERT ON public.user_badges
FOR EACH ROW EXECUTE FUNCTION create_badge_notification();