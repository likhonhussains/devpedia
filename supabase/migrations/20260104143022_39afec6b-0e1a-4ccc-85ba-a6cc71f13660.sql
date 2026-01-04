-- Fix messaging RLS policies that were accidentally created as RESTRICTIVE (non-permissive).
-- In Postgres RLS, if only restrictive policies exist, the effective permissive set is empty -> access denied.

-- conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (is_conversation_participant(id, auth.uid()));

DROP POLICY IF EXISTS "Participants can update group conversations" ON public.conversations;
CREATE POLICY "Participants can update group conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING ((is_group = true) AND is_conversation_participant(id, auth.uid()));

-- conversation_participants
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.creator_id = auth.uid()
  ))
  OR is_conversation_participant(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;
CREATE POLICY "Users can update their own participation"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- messages
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = sender_id) AND is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (is_conversation_participant(conversation_id, auth.uid()));
