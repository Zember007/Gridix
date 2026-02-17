export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      agent_application_contracts: {
        Row: {
          application_id: string;
          contract_template_path: string;
          created_at: string;
          id: string;
          signature_meta: Json | null;
          signature_path: string;
          signed_at: string;
          signed_contract_mime: string;
          signed_contract_path: string;
          template_id: number | null;
          template_lang: string | null;
        };
        Insert: {
          application_id: string;
          contract_template_path: string;
          created_at?: string;
          id?: string;
          signature_meta?: Json | null;
          signature_path: string;
          signed_at?: string;
          signed_contract_mime: string;
          signed_contract_path: string;
          template_id?: number | null;
          template_lang?: string | null;
        };
        Update: {
          application_id?: string;
          contract_template_path?: string;
          created_at?: string;
          id?: string;
          signature_meta?: Json | null;
          signature_path?: string;
          signed_at?: string;
          signed_contract_mime?: string;
          signed_contract_path?: string;
          template_id?: number | null;
          template_lang?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_application_contracts_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "agent_applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_application_contracts_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "agent_contract_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_applications: {
        Row: {
          agent_company_type: string | null;
          agent_user_id: string | null;
          agent_registered_office: string | null;
          agent_representative_name: string | null;
          agent_representative_title: string | null;
          agreement_signed: boolean | null;
          agreement_signed_at: string | null;
          bank_details: Json | null;
          company_name: string | null;
          commission_rate: number | null;
          contract_template_path: string | null;
          created_at: string;
          developer_user_id: string | null;
          email: string;
          full_name: string;
          id: string;
          legal_address: string | null;
          phone: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          signature_meta: Json;
          signature_method: string | null;
          signature_path: string | null;
          signed_contract_created_at: string | null;
          signed_contract_mime: string | null;
          signed_contract_path: string | null;
          status: string;
          tax_id: string | null;
          type: string | null;
        };
        Insert: {
          agent_company_type?: string | null;
          agent_user_id?: string | null;
          agent_registered_office?: string | null;
          agent_representative_name?: string | null;
          agent_representative_title?: string | null;
          agreement_signed?: boolean | null;
          agreement_signed_at?: string | null;
          bank_details?: Json | null;
          company_name?: string | null;
          commission_rate?: number | null;
          contract_template_path?: string | null;
          created_at?: string;
          developer_user_id?: string | null;
          email: string;
          full_name: string;
          id?: string;
          legal_address?: string | null;
          phone: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          signature_meta?: Json;
          signature_method?: string | null;
          signature_path?: string | null;
          signed_contract_created_at?: string | null;
          signed_contract_mime?: string | null;
          signed_contract_path?: string | null;
          status?: string;
          tax_id?: string | null;
          type?: string | null;
        };
        Update: {
          agent_company_type?: string | null;
          agent_user_id?: string | null;
          agent_registered_office?: string | null;
          agent_representative_name?: string | null;
          agent_representative_title?: string | null;
          agreement_signed?: boolean | null;
          agreement_signed_at?: string | null;
          bank_details?: Json | null;
          company_name?: string | null;
          commission_rate?: number | null;
          contract_template_path?: string | null;
          created_at?: string;
          developer_user_id?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          legal_address?: string | null;
          phone?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          signature_meta?: Json;
          signature_method?: string | null;
          signature_path?: string | null;
          signed_contract_created_at?: string | null;
          signed_contract_mime?: string | null;
          signed_contract_path?: string | null;
          status?: string;
          tax_id?: string | null;
          type?: string | null;
        };
        Relationships: [];
      };
      agent_contract_templates: {
        Row: {
          content_html: string | null;
          created_at: string;
          developer_user_id: string;
          id: number;
          lang: string;
          name: string;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          content_html?: string | null;
          created_at?: string;
          developer_user_id: string;
          id?: number;
          lang?: string;
          name: string;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          content_html?: string | null;
          created_at?: string;
          developer_user_id?: string;
          id?: number;
          lang?: string;
          name?: string;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_payouts: {
        Row: {
          agent_id: string | null;
          amount: number;
          created_at: string;
          id: string;
          method: string | null;
          payout_date: string;
          status: string;
        };
        Insert: {
          agent_id?: string | null;
          amount: number;
          created_at?: string;
          id?: string;
          method?: string | null;
          payout_date?: string;
          status?: string;
        };
        Update: {
          agent_id?: string | null;
          amount?: number;
          created_at?: string;
          id?: string;
          method?: string | null;
          payout_date?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_payouts_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_program_settings: {
        Row: {
          agreement_effective_date: string | null;
          agreement_end_date: string | null;
          created_at: string;
          default_commission_rate: number;
          developer_company_type: string | null;
          developer_registered_office: string | null;
          developer_representative_name: string | null;
          developer_representative_title: string | null;
          developer_signature_path: string | null;
          developer_stamp_path: string | null;
          developer_user_id: string;
          exclusivity: string;
          force_majeure_weeks: number;
          lead_lock_days: number;
          originals_count: number;
          products_description: string | null;
          payout_terms: string | null;
          territory: string | null;
          updated_at: string;
        };
        Insert: {
          agreement_effective_date?: string | null;
          agreement_end_date?: string | null;
          created_at?: string;
          default_commission_rate?: number;
          developer_company_type?: string | null;
          developer_registered_office?: string | null;
          developer_representative_name?: string | null;
          developer_representative_title?: string | null;
          developer_signature_path?: string | null;
          developer_stamp_path?: string | null;
          developer_user_id: string;
          exclusivity?: string;
          force_majeure_weeks?: number;
          lead_lock_days?: number;
          originals_count?: number;
          products_description?: string | null;
          payout_terms?: string | null;
          territory?: string | null;
          updated_at?: string;
        };
        Update: {
          agreement_effective_date?: string | null;
          agreement_end_date?: string | null;
          created_at?: string;
          default_commission_rate?: number;
          developer_company_type?: string | null;
          developer_registered_office?: string | null;
          developer_representative_name?: string | null;
          developer_representative_title?: string | null;
          developer_signature_path?: string | null;
          developer_stamp_path?: string | null;
          developer_user_id?: string;
          exclusivity?: string;
          force_majeure_weeks?: number;
          lead_lock_days?: number;
          originals_count?: number;
          products_description?: string | null;
          payout_terms?: string | null;
          territory?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      apartment_daily_views: {
        Row: {
          apartment_id: string;
          day: string;
          views: number;
        };
        Insert: {
          apartment_id: string;
          day: string;
          views?: number;
        };
        Update: {
          apartment_id?: string;
          day?: string;
          views?: number;
        };
        Relationships: [
          {
            foreignKeyName: "apartment_daily_views_apartment_id_fkey";
            columns: ["apartment_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          },
        ];
      };
      apartment_photos: {
        Row: {
          apartment_id: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string;
          order_index: number;
          updated_at: string;
        };
        Insert: {
          apartment_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url: string;
          order_index?: number;
          updated_at?: string;
        };
        Update: {
          apartment_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string;
          order_index?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "apartment_photos_apartment_id_fkey";
            columns: ["apartment_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          },
        ];
      };
      apartment_views: {
        Row: {
          apartment_id: string;
          created_at: string;
          id: string;
          ip_address: unknown;
          project_id: string;
          referrer: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          apartment_id: string;
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          project_id: string;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          apartment_id?: string;
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          project_id?: string;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "apartment_views_apartment_id_fkey";
            columns: ["apartment_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "apartment_views_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      apartments: {
        Row: {
          apartment_number: string;
          area: number;
          created_at: string;
          custom_fields: Json | null;
          floor_number: number;
          floor_plan_id: string | null;
          id: string;
          polygon: Json | null;
          price: number | null;
          project_id: string;
          rooms: string;
          status: string;
          type: Database["public"]["Enums"]["apartment_type"] | null;
          updated_at: string;
        };
        Insert: {
          apartment_number: string;
          area?: number;
          created_at?: string;
          custom_fields?: Json | null;
          floor_number: number;
          floor_plan_id?: string | null;
          id?: string;
          polygon?: Json | null;
          price?: number | null;
          project_id: string;
          rooms: string;
          status?: string;
          type?: Database["public"]["Enums"]["apartment_type"] | null;
          updated_at?: string;
        };
        Update: {
          apartment_number?: string;
          area?: number;
          created_at?: string;
          custom_fields?: Json | null;
          floor_number?: number;
          floor_plan_id?: string | null;
          id?: string;
          polygon?: Json | null;
          price?: number | null;
          project_id?: string;
          rooms?: string;
          status?: string;
          type?: Database["public"]["Enums"]["apartment_type"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "apartments_floor_plan_id_fkey";
            columns: ["floor_plan_id"];
            isOneToOne: false;
            referencedRelation: "floor_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "apartments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      banned_users: {
        Row: {
          banned_at: string;
          banned_by: string;
          id: string;
          reason: string | null;
          unbanned_at: string | null;
          user_id: string;
        };
        Insert: {
          banned_at?: string;
          banned_by: string;
          id?: string;
          reason?: string | null;
          unbanned_at?: string | null;
          user_id: string;
        };
        Update: {
          banned_at?: string;
          banned_by?: string;
          id?: string;
          reason?: string | null;
          unbanned_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      bitrix_deal_links: {
        Row: {
          apartment_id: string;
          bitrix_deal_id: number;
          created_at: string;
          crm_connection_id: string;
          id: string;
          lead_id: string | null;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          apartment_id: string;
          bitrix_deal_id: number;
          created_at?: string;
          crm_connection_id: string;
          id?: string;
          lead_id?: string | null;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          apartment_id?: string;
          bitrix_deal_id?: number;
          created_at?: string;
          crm_connection_id?: string;
          id?: string;
          lead_id?: string | null;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bitrix_deal_links_apartment_id_fkey";
            columns: ["apartment_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bitrix_deal_links_crm_connection_id_fkey";
            columns: ["crm_connection_id"];
            isOneToOne: false;
            referencedRelation: "crm_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bitrix_deal_links_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bitrix_deal_links_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      bitrix_pending_installs: {
        Row: {
          access_token: string;
          claim_token: string | null;
          created_at: string;
          domain: string;
          id: string;
          member_id: string;
          refresh_token: string;
          subdomain: string;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          claim_token?: string | null;
          created_at?: string;
          domain: string;
          id?: string;
          member_id: string;
          refresh_token: string;
          subdomain: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          claim_token?: string | null;
          created_at?: string;
          domain?: string;
          id?: string;
          member_id?: string;
          refresh_token?: string;
          subdomain?: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bitrix_stage_mapping: {
        Row: {
          bitrix_stage_id: string;
          created_at: string;
          id: string;
          lead_pipeline_stage_id: string;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          bitrix_stage_id: string;
          created_at?: string;
          id?: string;
          lead_pipeline_stage_id: string;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          bitrix_stage_id?: string;
          created_at?: string;
          id?: string;
          lead_pipeline_stage_id?: string;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bitrix_stage_mapping_lead_pipeline_stage_id_fkey";
            columns: ["lead_pipeline_stage_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnel_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bitrix_stage_mapping_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      building_floors: {
        Row: {
          color: string;
          created_at: string;
          facade_id: string | null;
          floor_number: number;
          id: string;
          polygon: Json;
          project_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          facade_id?: string | null;
          floor_number: number;
          id?: string;
          polygon?: Json;
          project_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          facade_id?: string | null;
          floor_number?: number;
          id?: string;
          polygon?: Json;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "building_floors_facade_id_fkey";
            columns: ["facade_id"];
            isOneToOne: false;
            referencedRelation: "project_facades";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "building_floors_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_tiers: {
        Row: {
          commission_percentage: number;
          created_at: string;
          id: string;
          is_active: boolean;
          link_type: string | null;
          max_projects: number | null;
          min_projects: number;
          updated_at: string;
        };
        Insert: {
          commission_percentage: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          link_type?: string | null;
          max_projects?: number | null;
          min_projects?: number;
          updated_at?: string;
        };
        Update: {
          commission_percentage?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          link_type?: string | null;
          max_projects?: number | null;
          min_projects?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_settings: {
        Row: {
          address: string | null;
          bank_name: string | null;
          company_name: string;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          email: string | null;
          iban: string | null;
          id: string;
          industry: string | null;
          logo_url: string | null;
          phone: string | null;
          system_domain: string | null;
          tax_id: string | null;
          updated_at: string | null;
          user_id: string;
          vat_payer: boolean | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          bank_name?: string | null;
          company_name: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          email?: string | null;
          iban?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          phone?: string | null;
          system_domain?: string | null;
          tax_id?: string | null;
          updated_at?: string | null;
          user_id: string;
          vat_payer?: boolean | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          bank_name?: string | null;
          company_name?: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          email?: string | null;
          iban?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          phone?: string | null;
          system_domain?: string | null;
          tax_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
          vat_payer?: boolean | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_automation_job_runs: {
        Row: {
          details: Json;
          error: string | null;
          finished_at: string | null;
          id: string;
          job_id: string;
          started_at: string;
          status: string;
        };
        Insert: {
          details?: Json;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          job_id: string;
          started_at?: string;
          status: string;
        };
        Update: {
          details?: Json;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          job_id?: string;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_automation_job_runs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "crm_automation_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_automation_jobs: {
        Row: {
          attempts: number;
          context: Json;
          created_at: string;
          funnel_id: string;
          id: string;
          last_error: string | null;
          lead_id: string;
          run_at: string;
          stage_id: string | null;
          status: string;
          trigger_id: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          context?: Json;
          created_at?: string;
          funnel_id: string;
          id?: string;
          last_error?: string | null;
          lead_id: string;
          run_at: string;
          stage_id?: string | null;
          status?: string;
          trigger_id: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          context?: Json;
          created_at?: string;
          funnel_id?: string;
          id?: string;
          last_error?: string | null;
          lead_id?: string;
          run_at?: string;
          stage_id?: string | null;
          status?: string;
          trigger_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_automation_jobs_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_automation_jobs_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_automation_jobs_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnel_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_automation_jobs_trigger_id_fkey";
            columns: ["trigger_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnel_triggers";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_connections: {
        Row: {
          access_token: string | null;
          account_name: string | null;
          authorization_code: string | null;
          base_domain: string | null;
          bitrix_member_id: string | null;
          client_id: string | null;
          client_secret: string | null;
          created_at: string | null;
          crm_type: string;
          id: string;
          redirect_uri: string | null;
          refresh_token: string | null;
          subdomain: string;
          token_expires_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token?: string | null;
          account_name?: string | null;
          authorization_code?: string | null;
          base_domain?: string | null;
          bitrix_member_id?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          created_at?: string | null;
          crm_type: string;
          id?: string;
          redirect_uri?: string | null;
          refresh_token?: string | null;
          subdomain: string;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string | null;
          account_name?: string | null;
          authorization_code?: string | null;
          base_domain?: string | null;
          bitrix_member_id?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          created_at?: string | null;
          crm_type?: string;
          id?: string;
          redirect_uri?: string | null;
          refresh_token?: string | null;
          subdomain?: string;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      crm_funnel_stages: {
        Row: {
          color: string;
          created_at: string;
          crm_funnel_id: number | null;
          crm_pipeline_id: number | null;
          crm_stage_id: string | null;
          funnel_id: string;
          id: string;
          name: string;
          order_index: number;
          updated_at: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          crm_funnel_id?: number | null;
          crm_pipeline_id?: number | null;
          crm_stage_id?: string | null;
          funnel_id: string;
          id?: string;
          name: string;
          order_index?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          crm_funnel_id?: number | null;
          crm_pipeline_id?: number | null;
          crm_stage_id?: string | null;
          funnel_id?: string;
          id?: string;
          name?: string;
          order_index?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_funnel_stages_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnels";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_funnel_triggers: {
        Row: {
          config: Json;
          created_at: string;
          description: string;
          event: Database["public"]["Enums"]["crm_funnel_trigger_event"];
          funnel_id: string;
          icon: string;
          id: string;
          order_index: number;
          stage_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          description: string;
          event: Database["public"]["Enums"]["crm_funnel_trigger_event"];
          funnel_id: string;
          icon: string;
          id?: string;
          order_index?: number;
          stage_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          description?: string;
          event?: Database["public"]["Enums"]["crm_funnel_trigger_event"];
          funnel_id?: string;
          icon?: string;
          id?: string;
          order_index?: number;
          stage_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_funnel_triggers_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_funnel_triggers_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "crm_funnel_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_funnels: {
        Row: {
          amocrm_pipeline_id: number | null;
          created_at: string;
          crm_funnel_id: number | null;
          id: string;
          is_default: boolean;
          name: string;
          project_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amocrm_pipeline_id?: number | null;
          created_at?: string;
          crm_funnel_id?: number | null;
          id?: string;
          is_default?: boolean;
          name: string;
          project_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amocrm_pipeline_id?: number | null;
          created_at?: string;
          crm_funnel_id?: number | null;
          id?: string;
          is_default?: boolean;
          name?: string;
          project_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_funnels_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      floor_plans: {
        Row: {
          created_at: string;
          floor_number: number;
          floor_polygons: Json | null;
          id: string;
          image_url: string | null;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          floor_number: number;
          floor_polygons?: Json | null;
          id?: string;
          image_url?: string | null;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          floor_number?: number;
          floor_polygons?: Json | null;
          id?: string;
          image_url?: string | null;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "floor_plans_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      layout_photos: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string;
          layout_type: string;
          order_index: number;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url: string;
          layout_type: string;
          order_index?: number;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string;
          layout_type?: string;
          order_index?: number;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "layout_photos_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_activities: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          lead_id: string | null;
          metadata: Json | null;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          lead_id?: string | null;
          metadata?: Json | null;
          type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          lead_id?: string | null;
          metadata?: Json | null;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_history: {
        Row: {
          created_at: string;
          id: string;
          lead_id: string;
          text: string;
          type: Database["public"]["Enums"]["lead_history_type"];
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lead_id: string;
          text: string;
          type: Database["public"]["Enums"]["lead_history_type"];
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          lead_id?: string;
          text?: string;
          type?: Database["public"]["Enums"]["lead_history_type"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_reads: {
        Row: {
          created_at: string;
          lead_id: string;
          read_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          lead_id: string;
          read_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          lead_id?: string;
          read_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_reads_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_tags: {
        Row: {
          created_at: string;
          lead_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          lead_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          lead_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_tasks: {
        Row: {
          assigned_to_user_id: string | null;
          completed: boolean;
          created_at: string;
          due_date: string;
          due_time: string | null;
          id: string;
          lead_id: string;
          result: string | null;
          text: string;
          type: Database["public"]["Enums"]["lead_task_type"];
          updated_at: string;
        };
        Insert: {
          assigned_to_user_id?: string | null;
          completed?: boolean;
          created_at?: string;
          due_date: string;
          due_time?: string | null;
          id?: string;
          lead_id: string;
          result?: string | null;
          text: string;
          type?: Database["public"]["Enums"]["lead_task_type"];
          updated_at?: string;
        };
        Update: {
          assigned_to_user_id?: string | null;
          completed?: boolean;
          created_at?: string;
          due_date?: string;
          due_time?: string | null;
          id?: string;
          lead_id?: string;
          result?: string | null;
          text?: string;
          type?: Database["public"]["Enums"]["lead_task_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          agent_id: string | null;
          amocrm_contact_id: number | null;
          amocrm_error: string | null;
          amocrm_lead_id: number | null;
          amocrm_retries: number | null;
          amocrm_sent_at: string | null;
          apartment_id: string;
          assigned_to_user_id: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          notes: string | null;
          phone: string;
          pipeline_stage_id: string | null;
          project_id: string;
          source: string | null;
          status: string | null;
          tags: string[] | null;
          updated_at: string;
        };
        Insert: {
          agent_id?: string | null;
          amocrm_contact_id?: number | null;
          amocrm_error?: string | null;
          amocrm_lead_id?: number | null;
          amocrm_retries?: number | null;
          amocrm_sent_at?: string | null;
          apartment_id: string;
          assigned_to_user_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          notes?: string | null;
          phone: string;
          pipeline_stage_id?: string | null;
          project_id: string;
          source?: string | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Update: {
          agent_id?: string | null;
          amocrm_contact_id?: number | null;
          amocrm_error?: string | null;
          amocrm_lead_id?: number | null;
          amocrm_retries?: number | null;
          amocrm_sent_at?: string | null;
          apartment_id?: string;
          assigned_to_user_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string;
          pipeline_stage_id?: string | null;
          project_id?: string;
          source?: string | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_apartment_id_fkey";
            columns: ["apartment_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      manager_accounts: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          developer_id: string;
          email: string;
          full_name: string;
          id: string;
          invited_at: string;
          manager_id: string;
          phone: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          developer_id: string;
          email: string;
          full_name: string;
          id?: string;
          invited_at?: string;
          manager_id: string;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          developer_id?: string;
          email?: string;
          full_name?: string;
          id?: string;
          invited_at?: string;
          manager_id?: string;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_manager_accounts_developer_profile";
            columns: ["developer_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      manager_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          developer_id: string;
          email: string;
          expires_at: string | null;
          id: string;
          invitation_token: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          developer_id: string;
          email: string;
          expires_at?: string | null;
          id?: string;
          invitation_token?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          developer_id?: string;
          email?: string;
          expires_at?: string | null;
          id?: string;
          invitation_token?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      manager_permissions: {
        Row: {
          allowed: boolean;
          created_at: string;
          id: string;
          manager_account_id: string;
          permission_type: string;
          updated_at: string;
        };
        Insert: {
          allowed?: boolean;
          created_at?: string;
          id?: string;
          manager_account_id: string;
          permission_type: string;
          updated_at?: string;
        };
        Update: {
          allowed?: boolean;
          created_at?: string;
          id?: string;
          manager_account_id?: string;
          permission_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manager_permissions_manager_account_id_fkey";
            columns: ["manager_account_id"];
            isOneToOne: false;
            referencedRelation: "manager_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      manager_project_access: {
        Row: {
          created_at: string;
          id: string;
          manager_account_id: string;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          manager_account_id: string;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          manager_account_id?: string;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manager_project_access_manager_account_id_fkey";
            columns: ["manager_account_id"];
            isOneToOne: false;
            referencedRelation: "manager_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manager_project_access_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          job_id: string | null;
          onesignal_message_id: string | null;
          payload: Json;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          job_id?: string | null;
          onesignal_message_id?: string | null;
          payload?: Json;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          job_id?: string | null;
          onesignal_message_id?: string | null;
          payload?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "notification_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "notification_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_jobs: {
        Row: {
          attempts: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          id: string;
          idempotency_key: string;
          last_error: string | null;
          locale: string;
          max_attempts: number;
          onesignal_message_id: string | null;
          payload: Json;
          recipient_email: string | null;
          recipient_user_id: string;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_job_status"];
          template_key: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          id?: string;
          idempotency_key: string;
          last_error?: string | null;
          locale?: string;
          max_attempts?: number;
          onesignal_message_id?: string | null;
          payload?: Json;
          recipient_email?: string | null;
          recipient_user_id: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_job_status"];
          template_key: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          last_error?: string | null;
          locale?: string;
          max_attempts?: number;
          onesignal_message_id?: string | null;
          payload?: Json;
          recipient_email?: string | null;
          recipient_user_id?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_job_status"];
          template_key?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_jobs_recipient_user_id_fkey";
            columns: ["recipient_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_templates: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          html_template: string;
          id: number;
          is_active: boolean;
          key: string;
          locale: string;
          schema: Json;
          subject_template: string;
          updated_at: string;
        };
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          html_template: string;
          id?: number;
          is_active?: boolean;
          key: string;
          locale?: string;
          schema?: Json;
          subject_template: string;
          updated_at?: string;
        };
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          html_template?: string;
          id?: number;
          is_active?: boolean;
          key?: string;
          locale?: string;
          schema?: Json;
          subject_template?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      onesignal_user_links: {
        Row: {
          created_at: string;
          email: string;
          email_subscription_id: string | null;
          enabled: boolean;
          last_error: string | null;
          last_synced_at: string | null;
          onesignal_id: string | null;
          supabase_user_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          email_subscription_id?: string | null;
          enabled?: boolean;
          last_error?: string | null;
          last_synced_at?: string | null;
          onesignal_id?: string | null;
          supabase_user_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          email_subscription_id?: string | null;
          enabled?: boolean;
          last_error?: string | null;
          last_synced_at?: string | null;
          onesignal_id?: string | null;
          supabase_user_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "onesignal_user_links_supabase_user_id_fkey";
            columns: ["supabase_user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_clicks: {
        Row: {
          created_at: string;
          id: string;
          partner_id: string;
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          partner_id: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          partner_id?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_clicks_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partner_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          invitation_code: string;
          partner_id: string;
          status: string | null;
          type: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          email: string;
          expires_at?: string | null;
          id?: string;
          invitation_code: string;
          partner_id: string;
          status?: string | null;
          type?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          invitation_code?: string;
          partner_id?: string;
          status?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_invitations_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partner_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_links: {
        Row: {
          accepted_at: string | null;
          client_id: string;
          created_at: string;
          id: string;
          partner_id: string;
          status: string;
          type: string;
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          client_id: string;
          created_at?: string;
          id?: string;
          partner_id: string;
          status?: string;
          type: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          client_id?: string;
          created_at?: string;
          id?: string;
          partner_id?: string;
          status?: string;
          type?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_links_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_links_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partner_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_payouts: {
        Row: {
          amount: number;
          contact_info: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          partner_id: string;
          payment_details: Json | null;
          payment_method: string | null;
          processed_at: string | null;
          requested_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          contact_info?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          partner_id: string;
          payment_details?: Json | null;
          payment_method?: string | null;
          processed_at?: string | null;
          requested_at?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          contact_info?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          partner_id?: string;
          payment_details?: Json | null;
          payment_method?: string | null;
          processed_at?: string | null;
          requested_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partner_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_profiles: {
        Row: {
          commission_percentage: number | null;
          created_at: string;
          id: string;
          partner_code: string;
          status: string;
          total_earned: number;
          total_withdrawn: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          commission_percentage?: number | null;
          created_at?: string;
          id?: string;
          partner_code: string;
          status?: string;
          total_earned?: number;
          total_withdrawn?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          commission_percentage?: number | null;
          created_at?: string;
          id?: string;
          partner_code?: string;
          status?: string;
          total_earned?: number;
          total_withdrawn?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_bitrix_settings: {
        Row: {
          assigned_by_id: number | null;
          category_id: number | null;
          created_at: string;
          crm_connection_id: string;
          deal_link_uf_field: string;
          id: string;
          project_id: string;
          stage_id: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_by_id?: number | null;
          category_id?: number | null;
          created_at?: string;
          crm_connection_id: string;
          deal_link_uf_field?: string;
          id?: string;
          project_id: string;
          stage_id?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_by_id?: number | null;
          category_id?: number | null;
          created_at?: string;
          crm_connection_id?: string;
          deal_link_uf_field?: string;
          id?: string;
          project_id?: string;
          stage_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_bitrix_settings_crm_connection_id_fkey";
            columns: ["crm_connection_id"];
            isOneToOne: false;
            referencedRelation: "crm_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_bitrix_settings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_crm_settings: {
        Row: {
          created_at: string | null;
          crm_connection_id: string;
          id: string;
          pipeline_id: number | null;
          pipeline_name: string | null;
          project_id: string;
          responsible_user_id: number | null;
          status_id: number | null;
          status_name: string | null;
          updated_at: string | null;
          user_name: string | null;
        };
        Insert: {
          created_at?: string | null;
          crm_connection_id: string;
          id?: string;
          pipeline_id?: number | null;
          pipeline_name?: string | null;
          project_id: string;
          responsible_user_id?: number | null;
          status_id?: number | null;
          status_name?: string | null;
          updated_at?: string | null;
          user_name?: string | null;
        };
        Update: {
          created_at?: string | null;
          crm_connection_id?: string;
          id?: string;
          pipeline_id?: number | null;
          pipeline_name?: string | null;
          project_id?: string;
          responsible_user_id?: number | null;
          status_id?: number | null;
          status_name?: string | null;
          updated_at?: string | null;
          user_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_crm_settings_crm_connection_id_fkey";
            columns: ["crm_connection_id"];
            isOneToOne: false;
            referencedRelation: "crm_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_crm_settings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_custom_fields: {
        Row: {
          created_at: string;
          field_label: string;
          field_label_translations: Json | null;
          field_name: string;
          field_options: Json | null;
          field_type: string;
          id: string;
          is_required: boolean;
          is_visible: boolean;
          project_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          field_label: string;
          field_label_translations?: Json | null;
          field_name: string;
          field_options?: Json | null;
          field_type?: string;
          id?: string;
          is_required?: boolean;
          is_visible?: boolean;
          project_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          field_label?: string;
          field_label_translations?: Json | null;
          field_name?: string;
          field_options?: Json | null;
          field_type?: string;
          id?: string;
          is_required?: boolean;
          is_visible?: boolean;
          project_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_custom_fields_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_daily_metrics: {
        Row: {
          day: string;
          leads: number;
          project_id: string;
          views: number;
        };
        Insert: {
          day: string;
          leads?: number;
          project_id: string;
          views?: number;
        };
        Update: {
          day?: string;
          leads?: number;
          project_id?: string;
          views?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_daily_metrics_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_domains: {
        Row: {
          created_at: string;
          domain: string;
          id: string;
          is_primary: boolean;
          project_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          domain: string;
          id?: string;
          is_primary?: boolean;
          project_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          domain?: string;
          id?: string;
          is_primary?: boolean;
          project_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_domains_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_facades: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          name: string;
          order_index: number;
          project_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name: string;
          order_index?: number;
          project_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          order_index?: number;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_facades_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_field_settings: {
        Row: {
          created_at: string;
          field_label: string;
          field_name: string;
          field_type: string;
          id: string;
          is_custom: boolean;
          is_visible: boolean;
          project_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          field_label: string;
          field_name: string;
          field_type?: string;
          id?: string;
          is_custom?: boolean;
          is_visible?: boolean;
          project_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          field_label?: string;
          field_name?: string;
          field_type?: string;
          id?: string;
          is_custom?: boolean;
          is_visible?: boolean;
          project_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_field_settings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_sync_settings: {
        Row: {
          column_mapping: Json;
          created_at: string;
          error_message: string | null;
          excel_url: string;
          id: string;
          is_active: boolean;
          last_sync: string | null;
          next_sync: string | null;
          project_id: string;
          status: string;
          sync_interval: number;
          updated_at: string;
        };
        Insert: {
          column_mapping?: Json;
          created_at?: string;
          error_message?: string | null;
          excel_url: string;
          id?: string;
          is_active?: boolean;
          last_sync?: string | null;
          next_sync?: string | null;
          project_id: string;
          status?: string;
          sync_interval?: number;
          updated_at?: string;
        };
        Update: {
          column_mapping?: Json;
          created_at?: string;
          error_message?: string | null;
          excel_url?: string;
          id?: string;
          is_active?: boolean;
          last_sync?: string | null;
          next_sync?: string | null;
          project_id?: string;
          status?: string;
          sync_interval?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_sync_settings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_views: {
        Row: {
          created_at: string;
          id: string;
          ip_address: unknown;
          project_id: string;
          referrer: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          project_id: string;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          project_id?: string;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          address: string | null;
          available_languages: string[];
          building_image_url: string | null;
          created_at: string;
          currency: Database["public"]["Enums"]["currency_type"] | null;
          description: string | null;
          facade_open: boolean;
          floors: number;
          has_commercial: boolean | null;
          has_parking: boolean | null;
          id: string;
          installment_enabled: boolean | null;
          is_featured: boolean;
          is_public: boolean;
          is_public_visible: boolean | null;
          latitude: number | null;
          longitude: number | null;
          max_installment_months: number | null;
          min_down_payment_percent: number | null;
          name: string;
          pdf_presentation_url: string | null;
          polygon_settings_facade: Json | null;
          polygon_settings_floor: Json | null;
          project_type: Database["public"]["Enums"]["project_type"];
          slug: string | null;
          subscription_expires_at: string | null;
          subscription_status: string | null;
          theme_color: string | null;
          updated_at: string;
          user_id: string | null;
          view_count: number;
        };
        Insert: {
          address?: string | null;
          available_languages?: string[];
          building_image_url?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_type"] | null;
          description?: string | null;
          facade_open?: boolean;
          floors?: number;
          has_commercial?: boolean | null;
          has_parking?: boolean | null;
          id?: string;
          installment_enabled?: boolean | null;
          is_featured?: boolean;
          is_public?: boolean;
          is_public_visible?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          max_installment_months?: number | null;
          min_down_payment_percent?: number | null;
          name: string;
          pdf_presentation_url?: string | null;
          polygon_settings_facade?: Json | null;
          polygon_settings_floor?: Json | null;
          project_type?: Database["public"]["Enums"]["project_type"];
          slug?: string | null;
          subscription_expires_at?: string | null;
          subscription_status?: string | null;
          theme_color?: string | null;
          updated_at?: string;
          user_id?: string | null;
          view_count?: number;
        };
        Update: {
          address?: string | null;
          available_languages?: string[];
          building_image_url?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_type"] | null;
          description?: string | null;
          facade_open?: boolean;
          floors?: number;
          has_commercial?: boolean | null;
          has_parking?: boolean | null;
          id?: string;
          installment_enabled?: boolean | null;
          is_featured?: boolean;
          is_public?: boolean;
          is_public_visible?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          max_installment_months?: number | null;
          min_down_payment_percent?: number | null;
          name?: string;
          pdf_presentation_url?: string | null;
          polygon_settings_facade?: Json | null;
          polygon_settings_floor?: Json | null;
          project_type?: Database["public"]["Enums"]["project_type"];
          slug?: string | null;
          subscription_expires_at?: string | null;
          subscription_status?: string | null;
          theme_color?: string | null;
          updated_at?: string;
          user_id?: string | null;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_projects_user_profile";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_discounts: {
        Row: {
          created_at: string | null;
          discount_percentage: number;
          duration_months: number;
          id: string;
          is_active: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          discount_percentage: number;
          duration_months: number;
          id?: string;
          is_active?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          discount_percentage?: number;
          duration_months?: number;
          id?: string;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      subscription_history: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          new_status: string | null;
          old_status: string | null;
          subscription_id: string;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          new_status?: string | null;
          old_status?: string | null;
          subscription_id: string;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          new_status?: string | null;
          old_status?: string | null;
          subscription_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_history_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          base_price: number;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          base_price: number;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          base_price?: number;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          created_at: string;
          error_message: string | null;
          execution_time_ms: number | null;
          id: string;
          project_id: string;
          records_added: number | null;
          records_deleted: number | null;
          records_processed: number | null;
          records_updated: number | null;
          status: string;
          sync_settings_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          project_id: string;
          records_added?: number | null;
          records_deleted?: number | null;
          records_processed?: number | null;
          records_updated?: number | null;
          status: string;
          sync_settings_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          project_id?: string;
          records_added?: number | null;
          records_deleted?: number | null;
          records_processed?: number | null;
          records_updated?: number | null;
          status?: string;
          sync_settings_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sync_logs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sync_logs_sync_settings_id_fkey";
            columns: ["sync_settings_id"];
            isOneToOne: false;
            referencedRelation: "project_sync_settings";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          created_at: string | null;
          id: string;
          setting_key: string;
          setting_value: Json;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          setting_key: string;
          setting_value: Json;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_message_templates: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
          variables: string[];
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          variables?: string[];
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          variables?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "user_message_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_notification_preferences: {
        Row: {
          channel_email: boolean;
          channel_push: boolean;
          channel_telegram: boolean;
          created_at: string;
          notify_new_lead: boolean;
          notify_payment_received: boolean;
          notify_system_update: boolean;
          notify_task_due: boolean;
          telegram_last_checked_at: string | null;
          telegram_last_error: string | null;
          telegram_username: string | null;
          telegram_verified: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          channel_email?: boolean;
          channel_push?: boolean;
          channel_telegram?: boolean;
          created_at?: string;
          notify_new_lead?: boolean;
          notify_payment_received?: boolean;
          notify_system_update?: boolean;
          notify_task_due?: boolean;
          telegram_last_checked_at?: string | null;
          telegram_last_error?: string | null;
          telegram_username?: string | null;
          telegram_verified?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channel_email?: boolean;
          channel_push?: boolean;
          channel_telegram?: boolean;
          created_at?: string;
          notify_new_lead?: boolean;
          notify_payment_received?: boolean;
          notify_system_update?: boolean;
          notify_task_due?: boolean;
          telegram_last_checked_at?: string | null;
          telegram_last_error?: string | null;
          telegram_username?: string | null;
          telegram_verified?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          account_type: string;
          avatar_url: string | null;
          bank_name: string | null;
          billing_currency: string | null;
          company_type: string | null;
          company_name: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          iban: string | null;
          id: string;
          is_vat_payer: boolean | null;
          legal_address: string | null;
          marketing_emails_consent: boolean;
          partner_id: string | null;
          password_set_at: string | null;
          person_type: string | null;
          phone: string | null;
          preferred_locale: string;
          registered_office: string | null;
          representative_name: string | null;
          representative_title: string | null;
          tax_id: string | null;
          updated_at: string;
        };
        Insert: {
          account_type?: string;
          avatar_url?: string | null;
          bank_name?: string | null;
          billing_currency?: string | null;
          company_type?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          iban?: string | null;
          id: string;
          is_vat_payer?: boolean | null;
          legal_address?: string | null;
          marketing_emails_consent?: boolean;
          partner_id?: string | null;
          password_set_at?: string | null;
          person_type?: string | null;
          phone?: string | null;
          preferred_locale?: string;
          registered_office?: string | null;
          representative_name?: string | null;
          representative_title?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Update: {
          account_type?: string;
          avatar_url?: string | null;
          bank_name?: string | null;
          billing_currency?: string | null;
          company_type?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          iban?: string | null;
          id?: string;
          is_vat_payer?: boolean | null;
          legal_address?: string | null;
          marketing_emails_consent?: boolean;
          partner_id?: string | null;
          password_set_at?: string | null;
          person_type?: string | null;
          phone?: string | null;
          preferred_locale?: string;
          registered_office?: string | null;
          representative_name?: string | null;
          representative_title?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partner_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          cancelled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          discount_percentage: number | null;
          duration_months: number | null;
          final_price: number | null;
          id: string;
          invoice_generated_at: string | null;
          invoice_number: string | null;
          invoice_paid_at: string | null;
          invoice_requested_at: string | null;
          invoice_url: string | null;
          lemon_squeezy_customer_id: string | null;
          lemon_squeezy_subscription_id: string | null;
          partner_commission_amount: number | null;
          partner_commission_paid: boolean | null;
          payment_method: string | null;
          payment_purpose: string | null;
          plan_id: string;
          project_id: string | null;
          status: string;
          trial_ends_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          discount_percentage?: number | null;
          duration_months?: number | null;
          final_price?: number | null;
          id?: string;
          invoice_generated_at?: string | null;
          invoice_number?: string | null;
          invoice_paid_at?: string | null;
          invoice_requested_at?: string | null;
          invoice_url?: string | null;
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          partner_commission_amount?: number | null;
          partner_commission_paid?: boolean | null;
          payment_method?: string | null;
          payment_purpose?: string | null;
          plan_id: string;
          project_id?: string | null;
          status?: string;
          trial_ends_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          discount_percentage?: number | null;
          duration_months?: number | null;
          final_price?: number | null;
          id?: string;
          invoice_generated_at?: string | null;
          invoice_number?: string | null;
          invoice_paid_at?: string | null;
          invoice_requested_at?: string | null;
          invoice_url?: string | null;
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          partner_commission_amount?: number | null;
          partner_commission_paid?: boolean | null;
          payment_method?: string | null;
          payment_purpose?: string | null;
          plan_id?: string;
          project_id?: string | null;
          status?: string;
          trial_ends_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_user_profile";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_and_expire_subscriptions: {
        Args: never;
        Returns: {
          expired_count: number;
          trial_expired_count: number;
          updated_subscriptions: string[];
        }[];
      };
      cleanup_expired_invitations: { Args: never; Returns: number };
      create_default_manager_permissions: {
        Args: { manager_account_id: string };
        Returns: undefined;
      };
      crm_run_automation_jobs: { Args: { p_limit?: number }; Returns: Json };
      empty_admin_analytics: { Args: never; Returns: Json };
      ensure_unique_slug: {
        Args: { base_slug: string; project_id?: string };
        Returns: string;
      };
      generate_invitation_token: { Args: never; Returns: string };
      generate_partner_code: {
        Args: { user_id_param: string };
        Returns: string;
      };
      generate_slug: { Args: { input_text: string }; Returns: string };
      get_admin_analytics: {
        Args: {
          p_auth_user_id: string;
          p_developer_id?: string;
          p_end_ts?: string;
          p_is_manager_mode?: boolean;
          p_selected_project_id?: string;
          p_start_ts?: string;
        };
        Returns: Json;
      };
      get_partner_commission_percentage: {
        Args: { p_link_type: string; partner_id_param: string };
        Returns: number;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_view_count: {
        Args: { project_id: string };
        Returns: undefined;
      };
      initialize_default_fields: {
        Args: { p_project_id: string };
        Returns: undefined;
      };
      is_project_owner: {
        Args: { _project_id: string; _user_id: string };
        Returns: boolean;
      };
      is_superadmin: { Args: { _user_id: string }; Returns: boolean };
      needs_token_refresh: { Args: { settings_id: string }; Returns: boolean };
    };
    Enums: {
      apartment_type: "apartment" | "commercial" | "parking";
      app_role: "superadmin" | "admin" | "moderator" | "user";
      crm_funnel_trigger_event: "on_stage_entry" | "timer" | "on_tag_add";
      currency_type: "RUB" | "USD" | "EUR" | "GEL";
      lead_history_type:
        | "status_change"
        | "call"
        | "note"
        | "creation"
        | "task_completion"
        | "automation";
      lead_task_type: "call" | "meeting" | "message" | "payment" | "other";
      notification_channel: "email";
      notification_job_status: "queued" | "sending" | "sent" | "failed";
      project_type: "building" | "object";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      apartment_type: ["apartment", "commercial", "parking"],
      app_role: ["superadmin", "admin", "moderator", "user"],
      crm_funnel_trigger_event: ["on_stage_entry", "timer", "on_tag_add"],
      currency_type: ["RUB", "USD", "EUR", "GEL"],
      lead_history_type: [
        "status_change",
        "call",
        "note",
        "creation",
        "task_completion",
        "automation",
      ],
      lead_task_type: ["call", "meeting", "message", "payment", "other"],
      notification_channel: ["email"],
      notification_job_status: ["queued", "sending", "sent", "failed"],
      project_type: ["building", "object"],
    },
  },
} as const;
