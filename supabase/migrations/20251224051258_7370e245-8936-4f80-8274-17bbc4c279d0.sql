-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'message'
  actor_id UUID NOT NULL, -- user who performed the action
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers with security definer)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification on like
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id)
    VALUES (post_owner_id, 'like', NEW.user_id, NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for likes
CREATE TRIGGER on_like_created
AFTER INSERT ON public.likes
FOR EACH ROW
WHEN (NEW.post_id IS NOT NULL)
EXECUTE FUNCTION public.create_like_notification();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id)
    VALUES (post_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_comment_created
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.create_comment_notification();

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  
  RETURN NEW;
END;
$$;

-- Trigger for follows
CREATE TRIGGER on_follow_created
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.create_follow_notification();

-- Function to create notification on message
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Get the other participant in the conversation
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;
  
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, actor_id, message_id)
    VALUES (recipient_id, 'message', NEW.sender_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for messages
CREATE TRIGGER on_message_created
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.create_message_notification();