-- Fix conversation_participants INSERT policy
-- The issue is that when inserting both participants at once, 
-- the creator isn't yet a participant, so they can't add the other user

DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is adding themselves (always allowed)
  (user_id = auth.uid())
  OR
  -- User is the conversation creator (can add anyone)
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND creator_id = auth.uid()
  )
  OR
  -- User is an existing participant (can add others)
  is_conversation_participant(conversation_id, auth.uid())
);