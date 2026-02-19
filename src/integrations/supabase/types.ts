export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blog_entries: {
        Row: {
          author: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bodega_equipos: {
        Row: {
          color: string
          created_at: string
          estatus_al_almacenar: string
          fecha_ingreso_servicio: string
          fecha_ultimo_contacto: string | null
          id: string
          marca: string
          modelo: string
          nombre_cliente: string
          numero_serie: string
          service_clave: string
          service_id: string
          telefono_cliente: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          estatus_al_almacenar: string
          fecha_ingreso_servicio: string
          fecha_ultimo_contacto?: string | null
          id?: string
          marca: string
          modelo: string
          nombre_cliente: string
          numero_serie?: string
          service_clave: string
          service_id: string
          telefono_cliente?: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          estatus_al_almacenar?: string
          fecha_ingreso_servicio?: string
          fecha_ultimo_contacto?: string | null
          id?: string
          marca?: string
          modelo?: string
          nombre_cliente?: string
          numero_serie?: string
          service_clave?: string
          service_id?: string
          telefono_cliente?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bodega_equipos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      component_specs: {
        Row: {
          case_color: string | null
          case_fans_count: number | null
          case_fans_included: boolean | null
          case_form_factors: string[] | null
          case_includes_500w_psu: boolean | null
          case_is_compact: boolean | null
          case_max_gpu_length: number | null
          case_psu_position: string | null
          case_supports_liquid_cooling: boolean | null
          chipset: string | null
          component_type: string
          cooling_color: string | null
          cooling_fans_count: number | null
          cooling_type: string | null
          cpu_base_frequency: number | null
          cpu_has_igpu: boolean | null
          cpu_tdp: number | null
          created_at: string
          form_factor: string | null
          gpu_brand: string | null
          gpu_displayport_ports: number | null
          gpu_dvi_ports: number | null
          gpu_hdmi_ports: number | null
          gpu_length: number | null
          gpu_memory_capacity: number | null
          gpu_memory_type: string | null
          gpu_mini_displayport_ports: number | null
          gpu_tdp: number | null
          gpu_vga_ports: number | null
          id: string
          is_gamer: boolean | null
          m2_slots: number | null
          max_ram_speed: number | null
          product_id: string
          psu_color: string | null
          psu_efficiency: string | null
          psu_form_factor: string | null
          psu_modular: boolean | null
          psu_pcie_cable: boolean | null
          psu_wattage: number | null
          ram_capacity: number | null
          ram_modules: number | null
          ram_slots: number | null
          ram_speed: number | null
          ram_type: string | null
          socket: string | null
          storage_capacity: number | null
          storage_has_heatsink: boolean | null
          storage_interface: string | null
          storage_m2_size: string | null
          storage_speed: number | null
          storage_subtype: string | null
          storage_type: string | null
          updated_at: string
        }
        Insert: {
          case_color?: string | null
          case_fans_count?: number | null
          case_fans_included?: boolean | null
          case_form_factors?: string[] | null
          case_includes_500w_psu?: boolean | null
          case_is_compact?: boolean | null
          case_max_gpu_length?: number | null
          case_psu_position?: string | null
          case_supports_liquid_cooling?: boolean | null
          chipset?: string | null
          component_type: string
          cooling_color?: string | null
          cooling_fans_count?: number | null
          cooling_type?: string | null
          cpu_base_frequency?: number | null
          cpu_has_igpu?: boolean | null
          cpu_tdp?: number | null
          created_at?: string
          form_factor?: string | null
          gpu_brand?: string | null
          gpu_displayport_ports?: number | null
          gpu_dvi_ports?: number | null
          gpu_hdmi_ports?: number | null
          gpu_length?: number | null
          gpu_memory_capacity?: number | null
          gpu_memory_type?: string | null
          gpu_mini_displayport_ports?: number | null
          gpu_tdp?: number | null
          gpu_vga_ports?: number | null
          id?: string
          is_gamer?: boolean | null
          m2_slots?: number | null
          max_ram_speed?: number | null
          product_id: string
          psu_color?: string | null
          psu_efficiency?: string | null
          psu_form_factor?: string | null
          psu_modular?: boolean | null
          psu_pcie_cable?: boolean | null
          psu_wattage?: number | null
          ram_capacity?: number | null
          ram_modules?: number | null
          ram_slots?: number | null
          ram_speed?: number | null
          ram_type?: string | null
          socket?: string | null
          storage_capacity?: number | null
          storage_has_heatsink?: boolean | null
          storage_interface?: string | null
          storage_m2_size?: string | null
          storage_speed?: number | null
          storage_subtype?: string | null
          storage_type?: string | null
          updated_at?: string
        }
        Update: {
          case_color?: string | null
          case_fans_count?: number | null
          case_fans_included?: boolean | null
          case_form_factors?: string[] | null
          case_includes_500w_psu?: boolean | null
          case_is_compact?: boolean | null
          case_max_gpu_length?: number | null
          case_psu_position?: string | null
          case_supports_liquid_cooling?: boolean | null
          chipset?: string | null
          component_type?: string
          cooling_color?: string | null
          cooling_fans_count?: number | null
          cooling_type?: string | null
          cpu_base_frequency?: number | null
          cpu_has_igpu?: boolean | null
          cpu_tdp?: number | null
          created_at?: string
          form_factor?: string | null
          gpu_brand?: string | null
          gpu_displayport_ports?: number | null
          gpu_dvi_ports?: number | null
          gpu_hdmi_ports?: number | null
          gpu_length?: number | null
          gpu_memory_capacity?: number | null
          gpu_memory_type?: string | null
          gpu_mini_displayport_ports?: number | null
          gpu_tdp?: number | null
          gpu_vga_ports?: number | null
          id?: string
          is_gamer?: boolean | null
          m2_slots?: number | null
          max_ram_speed?: number | null
          product_id?: string
          psu_color?: string | null
          psu_efficiency?: string | null
          psu_form_factor?: string | null
          psu_modular?: boolean | null
          psu_pcie_cable?: boolean | null
          psu_wattage?: number | null
          ram_capacity?: number | null
          ram_modules?: number | null
          ram_slots?: number | null
          ram_speed?: number | null
          ram_type?: string | null
          socket?: string | null
          storage_capacity?: number | null
          storage_has_heatsink?: boolean | null
          storage_interface?: string | null
          storage_m2_size?: string | null
          storage_speed?: number | null
          storage_subtype?: string | null
          storage_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      exhibited_warehouses: {
        Row: {
          created_at: string
          id: string
          is_exhibited: boolean
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_exhibited?: boolean
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_exhibited?: boolean
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibited_warehouses_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: true
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      product_warehouse_stock: {
        Row: {
          created_at: string
          existencias: number
          id: string
          product_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          existencias?: number
          id?: string
          product_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          existencias?: number
          id?: string
          product_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          clave: string | null
          costo: number | null
          created_at: string
          existencias: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          clave?: string | null
          costo?: number | null
          created_at?: string
          existencias?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          clave?: string | null
          costo?: number | null
          created_at?: string
          existencias?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products_por_surtir: {
        Row: {
          clave: string
          created_at: string
          id: string
          nombre: string
          product_id: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          clave: string
          created_at?: string
          id?: string
          nombre: string
          product_id?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          clave?: string
          created_at?: string
          id?: string
          nombre?: string
          product_id?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_por_surtir_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_por_surtir_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_logs: {
        Row: {
          content: string
          created_at: string | null
          created_by_id: string
          created_by_name: string
          id: string
          project_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by_id: string
          created_by_name: string
          id?: string
          project_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by_id?: string
          created_by_name?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_user_id: string
          assigned_user_name: string
          cliente_nombre: string
          completed_at: string | null
          created_at: string | null
          descripcion: string | null
          discard_reason: string | null
          discarded_at: string | null
          empresa_institucion: string | null
          fecha: string
          id: string
          is_completed: boolean | null
          is_discarded: boolean | null
          monto_total: number | null
          nombre_proyecto: string
          project_number: number
          remision_numero: string | null
          telefono_contacto: string
          updated_at: string | null
        }
        Insert: {
          assigned_user_id: string
          assigned_user_name: string
          cliente_nombre: string
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          discard_reason?: string | null
          discarded_at?: string | null
          empresa_institucion?: string | null
          fecha?: string
          id?: string
          is_completed?: boolean | null
          is_discarded?: boolean | null
          monto_total?: number | null
          nombre_proyecto: string
          project_number?: number
          remision_numero?: string | null
          telefono_contacto: string
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string
          assigned_user_name?: string
          cliente_nombre?: string
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          discard_reason?: string | null
          discarded_at?: string | null
          empresa_institucion?: string | null
          fecha?: string
          id?: string
          is_completed?: boolean | null
          is_discarded?: boolean | null
          monto_total?: number | null
          nombre_proyecto?: string
          project_number?: number
          remision_numero?: string | null
          telefono_contacto?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          clave: string
          created_at: string
          descripcion: string | null
          display_order: number | null
          existencias: number | null
          id: string
          img_url: string | null
          is_active: boolean | null
          nombre: string
          precio: number
          updated_at: string
        }
        Insert: {
          clave: string
          created_at?: string
          descripcion?: string | null
          display_order?: number | null
          existencias?: number | null
          id?: string
          img_url?: string | null
          is_active?: boolean | null
          nombre: string
          precio: number
          updated_at?: string
        }
        Update: {
          clave?: string
          created_at?: string
          descripcion?: string | null
          display_order?: number | null
          existencias?: number | null
          id?: string
          img_url?: string | null
          is_active?: boolean | null
          nombre?: string
          precio?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          created_at: string
          device_type: string
          id: string
          issue_description: string
          name: string
          phone: string
          service_type: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_type: string
          id?: string
          issue_description: string
          name: string
          phone: string
          service_type: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_type?: string
          id?: string
          issue_description?: string
          name?: string
          phone?: string
          service_type?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          clave: string
          comentarios: string | null
          condicion: string
          created_at: string
          estatus: Database["public"]["Enums"]["service_status"]
          estatus_interno: string
          fecha_elaboracion: string
          id: string
          updated_at: string
        }
        Insert: {
          clave: string
          comentarios?: string | null
          condicion: string
          created_at?: string
          estatus?: Database["public"]["Enums"]["service_status"]
          estatus_interno?: string
          fecha_elaboracion?: string
          id?: string
          updated_at?: string
        }
        Update: {
          clave?: string
          comentarios?: string | null
          condicion?: string
          created_at?: string
          estatus?: Database["public"]["Enums"]["service_status"]
          estatus_interno?: string
          fecha_elaboracion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      software_esd: {
        Row: {
          clave: string
          created_at: string
          descripcion: string
          detalles: string | null
          display_order: number | null
          id: string
          img_url: string | null
          is_active: boolean | null
          marca: string
          precio: number
          updated_at: string
        }
        Insert: {
          clave: string
          created_at?: string
          descripcion: string
          detalles?: string | null
          display_order?: number | null
          id?: string
          img_url?: string | null
          is_active?: boolean | null
          marca: string
          precio: number
          updated_at?: string
        }
        Update: {
          clave?: string
          created_at?: string
          descripcion?: string
          detalles?: string | null
          display_order?: number | null
          id?: string
          img_url?: string | null
          is_active?: boolean | null
          marca?: string
          precio?: number
          updated_at?: string
        }
        Relationships: []
      }
      software_esd_brands: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_orders: {
        Row: {
          anticipo: number | null
          clave: string | null
          cliente: string
          comentarios: string | null
          created_at: string
          estatus: Database["public"]["Enums"]["special_order_status"]
          fecha: string
          fecha_aprox_entrega: string | null
          fecha_entrega: string | null
          folio_ingreso: string | null
          folio_servicio: string | null
          id: string
          precio: number | null
          producto: string
          remision: string | null
          resta: number | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          anticipo?: number | null
          clave?: string | null
          cliente: string
          comentarios?: string | null
          created_at?: string
          estatus?: Database["public"]["Enums"]["special_order_status"]
          fecha?: string
          fecha_aprox_entrega?: string | null
          fecha_entrega?: string | null
          folio_ingreso?: string | null
          folio_servicio?: string | null
          id?: string
          precio?: number | null
          producto: string
          remision?: string | null
          resta?: number | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          anticipo?: number | null
          clave?: string | null
          cliente?: string
          comentarios?: string | null
          created_at?: string
          estatus?: Database["public"]["Enums"]["special_order_status"]
          fecha?: string
          fecha_aprox_entrega?: string | null
          fecha_entrega?: string | null
          folio_ingreso?: string | null
          folio_servicio?: string | null
          id?: string
          precio?: number | null
          producto?: string
          remision?: string | null
          resta?: number | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          meta_mensual: number | null
          show_public_prices: boolean
          updated_at: string
          ventas_at: number | null
          ventas_csc: number | null
        }
        Insert: {
          id?: string
          meta_mensual?: number | null
          show_public_prices?: boolean
          updated_at?: string
          ventas_at?: number | null
          ventas_csc?: number | null
        }
        Update: {
          id?: string
          meta_mensual?: number | null
          show_public_prices?: boolean
          updated_at?: string
          ventas_at?: number | null
          ventas_csc?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          created_at: string
          id: string
          name: string
          profit_multiplier: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          profit_multiplier?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          profit_multiplier?: number
        }
        Relationships: []
      }
      warranties: {
        Row: {
          clave_producto: string
          clave_proveedor: string
          cliente: string
          comentarios: string | null
          created_at: string
          descripcion_problema: string
          descripcion_producto: string
          estatus: Database["public"]["Enums"]["warranty_status"]
          fecha_ingreso: string
          folio_servicio: string | null
          id: string
          remision_factura: string
          updated_at: string
        }
        Insert: {
          clave_producto: string
          clave_proveedor: string
          cliente: string
          comentarios?: string | null
          created_at?: string
          descripcion_problema: string
          descripcion_producto: string
          estatus?: Database["public"]["Enums"]["warranty_status"]
          fecha_ingreso?: string
          folio_servicio?: string | null
          id?: string
          remision_factura: string
          updated_at?: string
        }
        Update: {
          clave_producto?: string
          clave_proveedor?: string
          cliente?: string
          comentarios?: string | null
          created_at?: string
          descripcion_problema?: string
          descripcion_producto?: string
          estatus?: Database["public"]["Enums"]["warranty_status"]
          fecha_ingreso?: string
          folio_servicio?: string | null
          id?: string
          remision_factura?: string
          updated_at?: string
        }
        Relationships: []
      }
      web_orders: {
        Row: {
          billing_data: string | null
          created_at: string
          delivery_method: string | null
          id: string
          items: Json
          notes: string | null
          order_number: number
          payment_method: string
          phone: string
          requires_quote: boolean
          shipping_option: string | null
          status: string
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          billing_data?: string | null
          created_at?: string
          delivery_method?: string | null
          id?: string
          items: Json
          notes?: string | null
          order_number?: number
          payment_method: string
          phone: string
          requires_quote?: boolean
          shipping_option?: string | null
          status?: string
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          billing_data?: string | null
          created_at?: string
          delivery_method?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: number
          payment_method?: string
          phone?: string
          requires_quote?: boolean
          shipping_option?: string | null
          status?: string
          subtotal?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_phone_exists: { Args: { phone_to_check: string }; Returns: boolean }
      create_web_order: {
        Args: {
          p_billing_data?: string
          p_delivery_method: string
          p_items: Json
          p_payment_method: string
          p_phone: string
          p_requires_quote: boolean
          p_shipping_option?: string
          p_subtotal: number
        }
        Returns: number
      }
      get_product_total_stock: { Args: { p_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_order_by_folio: {
        Args: { p_folio: string }
        Returns: {
          comentarios: string
          estatus: string
          fecha_aprox_entrega: string
          folio_ingreso: string
          folio_servicio: string
          producto: string
          remision: string
        }[]
      }
      submit_contact: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_phone: string
          p_subject: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "tecnico" | "ventas" | "supervisor"
      service_status: "Emitida" | "Remitida" | "Facturada" | "Cancelada"
      special_order_status:
        | "Notificado con Esdras"
        | "Pedido"
        | "En tienda"
        | "Entregado"
      warranty_status: "En revisión" | "Con proveedor" | "Listo para su entrega"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "tecnico", "ventas", "supervisor"],
      service_status: ["Emitida", "Remitida", "Facturada", "Cancelada"],
      special_order_status: [
        "Notificado con Esdras",
        "Pedido",
        "En tienda",
        "Entregado",
      ],
      warranty_status: [
        "En revisión",
        "Con proveedor",
        "Listo para su entrega",
      ],
    },
  },
} as const
