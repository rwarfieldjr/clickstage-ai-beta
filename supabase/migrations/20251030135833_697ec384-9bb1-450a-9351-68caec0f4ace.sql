-- Fix admin_actions INSERT policy to enable audit logging
-- This policy allows admins to insert audit log entries for their actions

CREATE POLICY "Admins can log actions"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);