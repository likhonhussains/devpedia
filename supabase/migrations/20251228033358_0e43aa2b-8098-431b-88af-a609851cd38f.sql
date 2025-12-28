-- Add group chat columns to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS creator_id uuid;

-- Create index for group conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON public.conversations(is_group);

-- Update RLS to allow group members to see group conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (is_conversation_participant(id, auth.uid()));

-- Allow updating group conversation details by participants
CREATE POLICY "Participants can update group conversations"
ON public.conversations FOR UPDATE
USING (is_group = true AND is_conversation_participant(id, auth.uid()));

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;