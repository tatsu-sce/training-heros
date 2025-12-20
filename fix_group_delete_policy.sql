-- Fix: Allow owners to delete their groups
CREATE POLICY "Owner can delete group" 
ON public.groups 
FOR DELETE 
USING (auth.uid() = owner_id);
