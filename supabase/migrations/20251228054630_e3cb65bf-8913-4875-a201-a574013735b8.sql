-- Add voice note columns to comments table
ALTER TABLE public.comments 
ADD COLUMN audio_url TEXT,
ADD COLUMN transcription TEXT,
ADD COLUMN is_voice_note BOOLEAN DEFAULT false;

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for voice notes
CREATE POLICY "Anyone can view voice notes"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes');

CREATE POLICY "Authenticated users can upload voice notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own voice notes"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);