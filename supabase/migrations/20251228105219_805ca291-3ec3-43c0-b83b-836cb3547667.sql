-- Fix 1: Update profiles table RLS to require authentication for viewing
-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy that requires authentication to view full profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to only see minimal public info (username, display_name, avatar_url)
-- This is handled by only allowing authenticated users to see full profiles

-- Fix 2: Update conversation_participants INSERT policy to prevent unauthorized access
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

-- Create a more restrictive INSERT policy
-- Users can only add participants if they are already a participant OR they are the conversation creator
CREATE POLICY "Participants or creators can add members"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is adding themselves AND is the conversation creator
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id AND creator_id = auth.uid()
  ))
  OR
  -- User is already a participant in the conversation (can add others)
  (is_conversation_participant(conversation_id, auth.uid()))
);