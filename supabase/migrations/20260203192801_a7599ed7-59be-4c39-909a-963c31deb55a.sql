-- Create projects table
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_number SERIAL UNIQUE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cliente_nombre text NOT NULL,
  telefono_contacto text NOT NULL,
  nombre_proyecto text NOT NULL,
  descripcion text,
  assigned_user_id uuid NOT NULL REFERENCES auth.users(id),
  assigned_user_name text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  remision_numero text,
  monto_total numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create project logs table for bitácora
CREATE TABLE public.project_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by_id uuid NOT NULL REFERENCES auth.users(id),
  created_by_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_logs ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
-- Admin can see all projects
CREATE POLICY "Admin can view all projects"
ON public.projects FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tecnico and ventas can only see their own projects
CREATE POLICY "Users can view own projects"
ON public.projects FOR SELECT
USING (
  assigned_user_id = auth.uid() AND 
  (has_role(auth.uid(), 'tecnico'::app_role) OR has_role(auth.uid(), 'ventas'::app_role))
);

-- Admin, tecnico, ventas can create projects
CREATE POLICY "Authorized users can create projects"
ON public.projects FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role)
);

-- Admin can update any project, others only their own
CREATE POLICY "Admin can update all projects"
ON public.projects FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own projects"
ON public.projects FOR UPDATE
USING (
  assigned_user_id = auth.uid() AND 
  (has_role(auth.uid(), 'tecnico'::app_role) OR has_role(auth.uid(), 'ventas'::app_role))
);

-- Only admin can delete projects
CREATE POLICY "Only admin can delete projects"
ON public.projects FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Project logs RLS policies
-- Can view logs if can view the project
CREATE POLICY "View logs for accessible projects"
ON public.project_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      p.assigned_user_id = auth.uid()
    )
  )
);

-- Can insert logs if can access the project
CREATE POLICY "Insert logs for accessible projects"
ON public.project_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      p.assigned_user_id = auth.uid()
    )
  )
);

-- Logs cannot be updated or deleted (immutable audit trail)

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();