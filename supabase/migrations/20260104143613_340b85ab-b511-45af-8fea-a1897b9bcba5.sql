-- If auth.uid() is unexpectedly null in some contexts, inline the JWT claim extraction.
-- This keeps the same security model but avoids dependence on the auth.uid() helper.

-- conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  nullif(current_setting('request.jwt.claim.sub', true), '')::uuid IS NOT NULL
);

-- conversation_participants
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
  OR (EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.creator_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  ))
  OR is_conversation_participant(conversation_id, nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
);

DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;
CREATE POLICY "Users can update their own participation"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (is_conversation_participant(conversation_id, nullif(current_setting('request.jwt.claim.sub', true), '')::uuid));

-- messages
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (nullif(current_setting('request.jwt.claim.sub', true), '')::uuid = sender_id)
  AND is_conversation_participant(conversation_id, nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (is_conversation_participant(conversation_id, nullif(current_setting('request.jwt.claim.sub', true), '')::uuid));
