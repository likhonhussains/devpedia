-- Allow group creators to add themselves as admin when creating a private group
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;

CREATE POLICY "Group admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- Existing condition: group admins can add members
  is_group_admin(group_id, auth.uid()) 
  OR 
  -- Self-join to public groups
  ((auth.uid() = user_id) AND (EXISTS ( SELECT 1 FROM groups WHERE ((groups.id = group_members.group_id) AND (groups.privacy = 'public'::group_privacy)))))
  OR
  -- Creator adding themselves as admin (for new groups, including private)
  ((auth.uid() = user_id) AND (EXISTS ( SELECT 1 FROM groups WHERE ((groups.id = group_members.group_id) AND (groups.creator_id = auth.uid())))))
);