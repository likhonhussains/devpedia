-- Add slug column for SEO-friendly URLs
ALTER TABLE public.posts 
ADD COLUMN slug text UNIQUE;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title text, post_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert title to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(
    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  -- Limit slug length
  base_slug := left(base_slug, 60);
  
  -- Remove trailing hyphens
  base_slug := regexp_replace(base_slug, '-+$', '');
  
  -- Add short ID suffix for uniqueness (first 8 chars of UUID)
  final_slug := base_slug || '-' || left(post_id::text, 8);
  
  RETURN final_slug;
END;
$$;

-- Update existing posts with slugs
UPDATE public.posts 
SET slug = generate_slug(title, id)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE public.posts 
ALTER COLUMN slug SET NOT NULL;

-- Create trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.set_post_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_post_slug_trigger
BEFORE INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.set_post_slug();

-- Create index for fast slug lookups
CREATE INDEX idx_posts_slug ON public.posts(slug);