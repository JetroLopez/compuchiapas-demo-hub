
-- Add empresa_institucion column (optional)
ALTER TABLE public.projects
ADD COLUMN empresa_institucion text;

-- Add is_discarded and discarded_at columns for archiving
ALTER TABLE public.projects
ADD COLUMN is_discarded boolean DEFAULT false,
ADD COLUMN discarded_at timestamp with time zone;

-- Add discard_reason column
ALTER TABLE public.projects
ADD COLUMN discard_reason text;
