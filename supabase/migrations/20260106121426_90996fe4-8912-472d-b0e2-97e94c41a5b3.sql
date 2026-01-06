-- Fix groups INSERT policy to use proper auth pattern
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;

CREATE POLICY "Authenticated users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (
  (nullif(current_setting('request.jwt.claim.sub', true), '')::uuid) = creator_id
);