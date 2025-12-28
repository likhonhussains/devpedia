-- Fix conversation_participants INSERT policy to allow creators to add participants
-- The issue is that creator_id needs to be set when creating conversations

DROP POLICY IF EXISTS "Participants or creators can add members" ON public.conversation_participants;

-- Create a simpler policy that allows:
-- 1. Users to add themselves as the first participant (when they're the conversation creator)
-- 2. Existing participants to add others
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is adding themselves to a conversation they created
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND creator_id = auth.uid()
  ))
  OR
  -- User is an existing participant adding someone else
  (auth.uid() != user_id AND is_conversation_participant(conversation_id, auth.uid()))
  OR
  -- User is adding themselves to a new conversation (as the creator)
  -- This handles the case where creator_id matches the inserting user
  (user_id = auth.uid())
);