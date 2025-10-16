-- Create table for manager project access control
CREATE TABLE IF NOT EXISTS public.manager_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_account_id UUID NOT NULL REFERENCES public.manager_accounts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(manager_account_id, project_id)
);

-- Enable RLS on manager_project_access
ALTER TABLE public.manager_project_access ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_manager_project_access_manager_id 
  ON public.manager_project_access(manager_account_id);
  
CREATE INDEX IF NOT EXISTS idx_manager_project_access_project_id 
  ON public.manager_project_access(project_id);

-- RLS Policies for manager_project_access

-- Developers can view access rules for their own managers
CREATE POLICY "Developers can view their managers' project access"
ON public.manager_project_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.manager_accounts ma
    WHERE ma.id = manager_project_access.manager_account_id
    AND ma.developer_id = auth.uid()
  )
);

-- Developers can manage access rules for their own managers
CREATE POLICY "Developers can manage their managers' project access"
ON public.manager_project_access
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.manager_accounts ma
    WHERE ma.id = manager_project_access.manager_account_id
    AND ma.developer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.manager_accounts ma
    WHERE ma.id = manager_project_access.manager_account_id
    AND ma.developer_id = auth.uid()
  )
);

-- Managers can view their own access rules
CREATE POLICY "Managers can view their own project access"
ON public.manager_project_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.manager_accounts ma
    WHERE ma.id = manager_project_access.manager_account_id
    AND ma.manager_id = auth.uid()
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_manager_project_access_updated_at
BEFORE UPDATE ON public.manager_project_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.manager_project_access IS 
'Controls which projects each manager can access. If no records exist for a manager, they have access to all projects (backward compatibility). If records exist, they can only access specified projects.';

