-- Update special_orders policies to include supervisor
DROP POLICY IF EXISTS "Admin ventas tecnico can insert special orders" ON public.special_orders;
CREATE POLICY "Admin ventas tecnico supervisor can insert special orders" ON public.special_orders
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

DROP POLICY IF EXISTS "Admin ventas tecnico can update special orders" ON public.special_orders;
CREATE POLICY "Admin ventas tecnico supervisor can update special orders" ON public.special_orders
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

DROP POLICY IF EXISTS "Authenticated users can view special orders" ON public.special_orders;
CREATE POLICY "Authenticated users can view special orders" ON public.special_orders
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Update contact_submissions policies
DROP POLICY IF EXISTS "Admins can view submissions" ON public.contact_submissions;
CREATE POLICY "Admins and supervisors can view submissions" ON public.contact_submissions
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role) OR
  has_role(auth.uid(), 'ventas'::app_role)
);

DROP POLICY IF EXISTS "Admins and ventas can update submissions" ON public.contact_submissions;
CREATE POLICY "Admins ventas and supervisors can update submissions" ON public.contact_submissions
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Update web_orders policies
DROP POLICY IF EXISTS "Admins and ventas can view all orders" ON public.web_orders;
CREATE POLICY "Admins ventas and supervisors can view all orders" ON public.web_orders
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

DROP POLICY IF EXISTS "Admins and ventas can update orders" ON public.web_orders;
CREATE POLICY "Admins ventas and supervisors can update orders" ON public.web_orders
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Update projects policies
DROP POLICY IF EXISTS "Admin can view all projects" ON public.projects;
CREATE POLICY "Admin and supervisor can view all projects" ON public.projects
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

DROP POLICY IF EXISTS "Admin can update all projects" ON public.projects;
CREATE POLICY "Admin and supervisor can update all projects" ON public.projects
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

DROP POLICY IF EXISTS "Authorized users can create projects" ON public.projects;
CREATE POLICY "Authorized users can create projects" ON public.projects
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Update project_logs policies
DROP POLICY IF EXISTS "View logs for accessible projects" ON public.project_logs;
CREATE POLICY "View logs for accessible projects" ON public.project_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_logs.project_id AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'supervisor'::app_role) OR
      p.assigned_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Insert logs for accessible projects" ON public.project_logs;
CREATE POLICY "Insert logs for accessible projects" ON public.project_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_logs.project_id AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'supervisor'::app_role) OR
      p.assigned_user_id = auth.uid()
    )
  )
);

-- Update promotions policies
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins and supervisors can manage promotions" ON public.promotions
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role) OR
  has_role(auth.uid(), 'ventas'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role) OR
  has_role(auth.uid(), 'ventas'::app_role)
);

-- Update product_warehouse_stock policies
DROP POLICY IF EXISTS "Admins can manage stock" ON public.product_warehouse_stock;
CREATE POLICY "Admins and supervisors can manage stock" ON public.product_warehouse_stock
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role) OR
  has_role(auth.uid(), 'ventas'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role) OR
  has_role(auth.uid(), 'ventas'::app_role)
);

-- Update products_por_surtir policies  
DROP POLICY IF EXISTS "Admins and ventas can manage products por surtir" ON public.products_por_surtir;
CREATE POLICY "Admins ventas and supervisors can manage products por surtir" ON public.products_por_surtir
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Update services policies to add supervisor
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins and supervisors can manage services" ON public.services
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role)
);