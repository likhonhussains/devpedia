-- Add pdf_url column to ebooks table
ALTER TABLE public.ebooks ADD COLUMN pdf_url text;

-- Create storage bucket for ebook PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-pdfs', 'ebook-pdfs', true);

-- Create storage policies for ebook PDFs
CREATE POLICY "Anyone can view ebook PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'ebook-pdfs');

CREATE POLICY "Authenticated users can upload ebook PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ebook-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ebook PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ebook-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ebook PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'ebook-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);