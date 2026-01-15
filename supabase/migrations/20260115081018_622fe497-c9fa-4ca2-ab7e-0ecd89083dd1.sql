-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ventas';