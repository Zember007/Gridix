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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      amocrm_settings: {
        Row: {
          access_token: string | null
          account_name: string | null
          authorization_code: string | null
          base_domain: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          id: string
          pipeline_id: number
          pipeline_name: string | null
          project_id: string
          redirect_uri: string | null
          refresh_token: string | null
          responsible_user_id: number | null
          status_id: number | null
          status_name: string | null
          subdomain: string
          token_expires_at: string | null
          updated_at: string | null
          user_name: string | null
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          authorization_code?: string | null
          base_domain?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          pipeline_id: number
          pipeline_name?: string | null
          project_id: string
          redirect_uri?: string | null
          refresh_token?: string | null
          responsible_user_id?: number | null
          status_id?: number | null
          status_name?: string | null
          subdomain: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          authorization_code?: string | null
          base_domain?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          pipeline_id?: number
          pipeline_name?: string | null
          project_id?: string
          redirect_uri?: string | null
          refresh_token?: string | null
          responsible_user_id?: number | null
          status_id?: number | null
          status_name?: string | null
          subdomain?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amocrm_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_photos: {
        Row: {
          apartment_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          order_index: number
          updated_at: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_photos_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_views: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          ip_address: unknown
          project_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          project_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          project_id?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartment_views_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartment_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          apartment_number: string
          area: number
          created_at: string
          custom_fields: Json | null
          floor_number: number
          floor_plan_id: string | null
          id: string
          polygon: Json | null
          price: number | null
          project_id: string
          rooms: string
          status: string
          type: Database["public"]["Enums"]["apartment_type"] | null
          updated_at: string
        }
        Insert: {
          apartment_number: string
          area?: number
          created_at?: string
          custom_fields?: Json | null
          floor_number: number
          floor_plan_id?: string | null
          id?: string
          polygon?: Json | null
          price?: number | null
          project_id: string
          rooms: string
          status?: string
          type?: Database["public"]["Enums"]["apartment_type"] | null
          updated_at?: string
        }
        Update: {
          apartment_number?: string
          area?: number
          created_at?: string
          custom_fields?: Json | null
          floor_number?: number
          floor_plan_id?: string | null
          id?: string
          polygon?: Json | null
          price?: number | null
          project_id?: string
          rooms?: string
          status?: string
          type?: Database["public"]["Enums"]["apartment_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartments_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "floor_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          id: string
          reason: string | null
          unbanned_at: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          id?: string
          reason?: string | null
          unbanned_at?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          id?: string
          reason?: string | null
          unbanned_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      building_floors: {
        Row: {
          color: string
          created_at: string
          floor_number: number
          id: string
          polygon: Json
          project_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          floor_number: number
          id?: string
          polygon?: Json
          project_id: string
        }
        Update: {
          color?: string
          created_at?: string
          floor_number?: number
          id?: string
          polygon?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_floors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          commission_percentage: number
          created_at: string
          id: string
          is_active: boolean
          link_type: string | null
          max_projects: number | null
          min_projects: number
          updated_at: string
        }
        Insert: {
          commission_percentage: number
          created_at?: string
          id?: string
          is_active?: boolean
          link_type?: string | null
          max_projects?: number | null
          min_projects?: number
          updated_at?: string
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          link_type?: string | null
          max_projects?: number | null
          min_projects?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          bank_name: string | null
          company_name: string
          created_at: string | null
          currency: string | null
          email: string | null
          iban: string | null
          id: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          vat_payer: boolean | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          company_name: string
          created_at?: string | null
          currency?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          vat_payer?: boolean | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          company_name?: string
          created_at?: string | null
          currency?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          vat_payer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_connections: {
        Row: {
          access_token: string | null
          account_name: string | null
          authorization_code: string | null
          base_domain: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          crm_type: string
          id: string
          redirect_uri: string | null
          refresh_token: string | null
          subdomain: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          authorization_code?: string | null
          base_domain?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          crm_type: string
          id?: string
          redirect_uri?: string | null
          refresh_token?: string | null
          subdomain: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          authorization_code?: string | null
          base_domain?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          crm_type?: string
          id?: string
          redirect_uri?: string | null
          refresh_token?: string | null
          subdomain?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      floor_plans: {
        Row: {
          created_at: string
          floor_number: number
          floor_polygons: Json | null
          id: string
          image_url: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor_number: number
          floor_polygons?: Json | null
          id?: string
          image_url?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor_number?: number
          floor_polygons?: Json | null
          id?: string
          image_url?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          layout_type: string
          order_index: number
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          layout_type: string
          order_index?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          layout_type?: string
          order_index?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "layout_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          amocrm_contact_id: number | null
          amocrm_error: string | null
          amocrm_lead_id: number | null
          amocrm_retries: number | null
          amocrm_sent_at: string | null
          apartment_id: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          project_id: string
          source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amocrm_contact_id?: number | null
          amocrm_error?: string | null
          amocrm_lead_id?: number | null
          amocrm_retries?: number | null
          amocrm_sent_at?: string | null
          apartment_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          project_id: string
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amocrm_contact_id?: number | null
          amocrm_error?: string | null
          amocrm_lead_id?: number | null
          amocrm_retries?: number | null
          amocrm_sent_at?: string | null
          apartment_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          project_id?: string
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_accounts: {
        Row: {
          accepted_at: string | null
          created_at: string
          developer_id: string
          email: string
          full_name: string
          id: string
          invited_at: string
          manager_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          developer_id: string
          email: string
          full_name: string
          id?: string
          invited_at?: string
          manager_id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          developer_id?: string
          email?: string
          full_name?: string
          id?: string
          invited_at?: string
          manager_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_manager_accounts_developer_profile"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          developer_id: string
          email: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          developer_id: string
          email: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          developer_id?: string
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      manager_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          manager_account_id: string
          permission_type: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          manager_account_id: string
          permission_type: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          manager_account_id?: string
          permission_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_permissions_manager_account_id_fkey"
            columns: ["manager_account_id"]
            isOneToOne: false
            referencedRelation: "manager_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_project_access: {
        Row: {
          created_at: string
          id: string
          manager_account_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_account_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_account_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_project_access_manager_account_id_fkey"
            columns: ["manager_account_id"]
            isOneToOne: false
            referencedRelation: "manager_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_clicks: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_clicks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_code: string
          partner_id: string
          status: string | null
          type: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_code: string
          partner_id: string
          status?: string | null
          type?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_code?: string
          partner_id?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_invitations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          accepted_at: string | null
          client_id: string
          created_at: string
          id: string
          partner_id: string
          status: string
          type: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          partner_id: string
          status?: string
          type: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          status?: string
          type?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payouts: {
        Row: {
          amount: number
          contact_info: string | null
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contact_info?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_info?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          commission_percentage: number | null
          created_at: string
          id: string
          partner_code: string
          status: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_percentage?: number | null
          created_at?: string
          id?: string
          partner_code: string
          status?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_percentage?: number | null
          created_at?: string
          id?: string
          partner_code?: string
          status?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_crm_settings: {
        Row: {
          created_at: string | null
          crm_connection_id: string
          id: string
          pipeline_id: number | null
          pipeline_name: string | null
          project_id: string
          responsible_user_id: number | null
          status_id: number | null
          status_name: string | null
          updated_at: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          crm_connection_id: string
          id?: string
          pipeline_id?: number | null
          pipeline_name?: string | null
          project_id: string
          responsible_user_id?: number | null
          status_id?: number | null
          status_name?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          crm_connection_id?: string
          id?: string
          pipeline_id?: number | null
          pipeline_name?: string | null
          project_id?: string
          responsible_user_id?: number | null
          status_id?: number | null
          status_name?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_crm_settings_crm_connection_id_fkey"
            columns: ["crm_connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_crm_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_custom_fields: {
        Row: {
          created_at: string
          field_label: string
          field_label_translations: Json | null
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean
          is_visible: boolean
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_label: string
          field_label_translations?: Json | null
          field_name: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_label?: string
          field_label_translations?: Json | null
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_custom_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_field_settings: {
        Row: {
          created_at: string
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_custom: boolean
          is_visible: boolean
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          is_custom?: boolean
          is_visible?: boolean
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_custom?: boolean
          is_visible?: boolean
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_field_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sync_settings: {
        Row: {
          column_mapping: Json
          created_at: string
          error_message: string | null
          excel_url: string
          id: string
          is_active: boolean
          last_sync: string | null
          next_sync: string | null
          project_id: string
          status: string
          sync_interval: number
          updated_at: string
        }
        Insert: {
          column_mapping?: Json
          created_at?: string
          error_message?: string | null
          excel_url: string
          id?: string
          is_active?: boolean
          last_sync?: string | null
          next_sync?: string | null
          project_id: string
          status?: string
          sync_interval?: number
          updated_at?: string
        }
        Update: {
          column_mapping?: Json
          created_at?: string
          error_message?: string | null
          excel_url?: string
          id?: string
          is_active?: boolean
          last_sync?: string | null
          next_sync?: string | null
          project_id?: string
          status?: string
          sync_interval?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sync_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          project_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          project_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          project_id?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          building_image_url: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          facade_open: boolean
          floors: number
          has_commercial: boolean | null
          has_parking: boolean | null
          id: string
          installment_enabled: boolean | null
          is_featured: boolean
          is_public: boolean
          is_public_visible: boolean | null
          latitude: number | null
          longitude: number | null
          max_installment_months: number | null
          min_down_payment_percent: number | null
          name: string
          pdf_presentation_url: string | null
          polygon_settings_facade: Json | null
          polygon_settings_floor: Json | null
          project_type: Database["public"]["Enums"]["project_type"]
          slug: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          theme_color: string | null
          updated_at: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          address?: string | null
          building_image_url?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          facade_open?: boolean
          floors?: number
          has_commercial?: boolean | null
          has_parking?: boolean | null
          id?: string
          installment_enabled?: boolean | null
          is_featured?: boolean
          is_public?: boolean
          is_public_visible?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_installment_months?: number | null
          min_down_payment_percent?: number | null
          name: string
          pdf_presentation_url?: string | null
          polygon_settings_facade?: Json | null
          polygon_settings_floor?: Json | null
          project_type?: Database["public"]["Enums"]["project_type"]
          slug?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          address?: string | null
          building_image_url?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          facade_open?: boolean
          floors?: number
          has_commercial?: boolean | null
          has_parking?: boolean | null
          id?: string
          installment_enabled?: boolean | null
          is_featured?: boolean
          is_public?: boolean
          is_public_visible?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_installment_months?: number | null
          min_down_payment_percent?: number | null
          name?: string
          pdf_presentation_url?: string | null
          polygon_settings_facade?: Json | null
          polygon_settings_floor?: Json | null
          project_type?: Database["public"]["Enums"]["project_type"]
          slug?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_discounts: {
        Row: {
          created_at: string | null
          discount_percentage: number
          duration_months: number
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage: number
          duration_months: number
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number
          duration_months?: number
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          subscription_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          subscription_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          base_price: number
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          project_id: string
          records_added: number | null
          records_deleted: number | null
          records_processed: number | null
          records_updated: number | null
          status: string
          sync_settings_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          project_id: string
          records_added?: number | null
          records_deleted?: number | null
          records_processed?: number | null
          records_updated?: number | null
          status: string
          sync_settings_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          project_id?: string
          records_added?: number | null
          records_deleted?: number | null
          records_processed?: number | null
          records_updated?: number | null
          status?: string
          sync_settings_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_sync_settings_id_fkey"
            columns: ["sync_settings_id"]
            isOneToOne: false
            referencedRelation: "project_sync_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bank_name: string | null
          billing_currency: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          iban: string | null
          id: string
          is_vat_payer: boolean | null
          legal_address: string | null
          partner_id: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          bank_name?: string | null
          billing_currency?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          iban?: string | null
          id: string
          is_vat_payer?: boolean | null
          legal_address?: string | null
          partner_id?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bank_name?: string | null
          billing_currency?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          iban?: string | null
          id?: string
          is_vat_payer?: boolean | null
          legal_address?: string | null
          partner_id?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          discount_percentage: number | null
          duration_months: number | null
          final_price: number | null
          id: string
          invoice_generated_at: string | null
          invoice_number: string | null
          invoice_paid_at: string | null
          invoice_requested_at: string | null
          invoice_url: string | null
          lemon_squeezy_customer_id: string | null
          lemon_squeezy_subscription_id: string | null
          partner_commission_amount: number | null
          partner_commission_paid: boolean | null
          payment_method: string | null
          payment_purpose: string | null
          plan_id: string
          project_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          final_price?: number | null
          id?: string
          invoice_generated_at?: string | null
          invoice_number?: string | null
          invoice_paid_at?: string | null
          invoice_requested_at?: string | null
          invoice_url?: string | null
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          partner_commission_amount?: number | null
          partner_commission_paid?: boolean | null
          payment_method?: string | null
          payment_purpose?: string | null
          plan_id: string
          project_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          final_price?: number | null
          id?: string
          invoice_generated_at?: string | null
          invoice_number?: string | null
          invoice_paid_at?: string | null
          invoice_requested_at?: string | null
          invoice_url?: string | null
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          partner_commission_amount?: number | null
          partner_commission_paid?: boolean | null
          payment_method?: string | null
          payment_purpose?: string | null
          plan_id?: string
          project_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_expire_subscriptions: {
        Args: never
        Returns: {
          expired_count: number
          trial_expired_count: number
          updated_subscriptions: string[]
        }[]
      }
      cleanup_expired_invitations: { Args: never; Returns: number }
      create_default_manager_permissions: {
        Args: { manager_account_id: string }
        Returns: undefined
      }
      ensure_unique_slug: {
        Args: { base_slug: string; project_id?: string }
        Returns: string
      }
      generate_invitation_token: { Args: never; Returns: string }
      generate_partner_code: {
        Args: { user_id_param: string }
        Returns: string
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_partner_commission_percentage: {
        Args: { p_link_type: string; partner_id_param: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view_count: { Args: { project_id: string }; Returns: undefined }
      initialize_default_fields: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      is_amocrm_configured: {
        Args: {
          settings_row: Database["public"]["Tables"]["amocrm_settings"]["Row"]
        }
        Returns: boolean
      }
      is_project_owner: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      needs_token_refresh: { Args: { settings_id: string }; Returns: boolean }
    }
    Enums: {
      apartment_type: "apartment" | "commercial" | "parking"
      app_role: "superadmin" | "admin" | "moderator" | "user"
      currency_type: "RUB" | "USD" | "EUR" | "GEL"
      project_type: "building" | "object"
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
      apartment_type: ["apartment", "commercial", "parking"],
      app_role: ["superadmin", "admin", "moderator", "user"],
      currency_type: ["RUB", "USD", "EUR", "GEL"],
      project_type: ["building", "object"],
    },
  },
} as const

