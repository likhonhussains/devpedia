-- Fix function search path for generate_slug
CREATE OR REPLACE FUNCTION public.generate_slug(title text, post_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
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