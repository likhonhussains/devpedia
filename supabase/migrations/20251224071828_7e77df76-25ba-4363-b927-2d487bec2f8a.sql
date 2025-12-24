-- Add cover_url and social links to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS github text,
ADD COLUMN IF NOT EXISTS linkedin text;