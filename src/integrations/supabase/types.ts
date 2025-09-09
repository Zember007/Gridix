export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          company_description: string | null
          company_name: string | null
          contact_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      amocrm_settings: {
        Row: {
          access_token: string | null
          authorization_code: string | null
          client_id: string
          client_secret: string
          created_at: string
          id: string
          pipeline_id: number
          project_id: string
          redirect_uri: string | null
          refresh_token: string | null
          responsible_user_id: number | null
          status_id: number | null
          subdomain: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          authorization_code?: string | null
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          pipeline_id: number
          project_id: string
          redirect_uri?: string | null
          refresh_token?: string | null
          responsible_user_id?: number | null
          status_id?: number | null
          subdomain: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          authorization_code?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          pipeline_id?: number
          project_id?: string
          redirect_uri?: string | null
          refresh_token?: string | null
          responsible_user_id?: number | null
          status_id?: number | null
          subdomain?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amocrm_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
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
          rooms:  number | string
          status: string
          type: Database["public"]["Enums"]["apartment_type"]
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
          rooms?:  number | string
          status?: string
          type?: Database["public"]["Enums"]["apartment_type"]
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
          rooms?: number | string
          status?: string
          type?: Database["public"]["Enums"]["apartment_type"]
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
      floor_plans: {
        Row: {
          created_at: string
          floor_number: number
          floor_polygons: Json | null
          id: string
          image_url: string | null
          polygon_settings: Json | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor_number: number
          floor_polygons?: Json | null
          id?: string
          image_url?: string | null
          polygon_settings?: Json | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor_number?: number
          floor_polygons?: Json | null
          id?: string
          image_url?: string | null
          polygon_settings?: Json | null
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
          field_label_translations?: Json | null
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
          field_label_translations?: Json | null
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
          field_label_translations?: Json | null
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
      project_custom_fields: {
        Row: {
          created_at: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean
          is_visible: boolean
          project_id: string
          sort_order: number
          updated_at: string
          field_label_translations?: Json | null
        }
        Insert: {
          created_at?: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          project_id: string
          sort_order?: number
          updated_at?: string
          field_label_translations?: Json | null
        }
        Update: {
          created_at?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          project_id?: string
          sort_order?: number
          updated_at?: string
          field_label_translations?: Json | null
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
      projects: {
        Row: {
          address: string | null
          building_image_url: string | null
          building_polygon_settings: Json | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          floors: number
          has_parking: boolean
          has_commercial: boolean
          id: string
          is_featured: boolean
          is_public: boolean
          latitude: number | null
          longitude: number | null
          name: string
          polygon_settings: Json | null
          slug: string | null
          updated_at: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          address?: string | null
          building_image_url?: string | null
          building_polygon_settings?: Json | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          floors?: number
          has_parking?: boolean
          has_commercial?: boolean
          id?: string
          is_featured?: boolean
          is_public?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          polygon_settings?: Json | null
          slug?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          address?: string | null
          building_image_url?: string | null
          building_polygon_settings?: Json | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          floors?: number
          has_parking?: boolean
          has_commercial?: boolean
          id?: string
          is_featured?: boolean
          is_public?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          polygon_settings?: Json | null
          slug?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          project_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          project_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
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
          {
            foreignKeyName: "project_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_accounts: {
        Row: {
          id: string
          developer_id: string
          manager_id: string
          email: string
          full_name: string
          phone: string | null
          status: "pending" | "active" | "suspended"
          invited_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          manager_id: string
          email: string
          full_name: string
          phone?: string | null
          status?: "pending" | "active" | "suspended"
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          manager_id?: string
          email?: string
          full_name?: string
          phone?: string | null
          status?: "pending" | "active" | "suspended"
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_accounts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_accounts_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      manager_invitations: {
        Row: {
          id: string
          developer_id: string
          email: string
          full_name: string
          phone: string | null
          invitation_token: string
          status: "pending" | "accepted" | "expired"
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          email: string
          full_name: string
          phone?: string | null
          invitation_token: string
          status?: "pending" | "accepted" | "expired"
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          email?: string
          full_name?: string
          phone?: string | null
          invitation_token?: string
          status?: "pending" | "accepted" | "expired"
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_invitations_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      manager_permissions: {
        Row: {
          manager_account_id: string
          permission_type: "view_projects" | "edit_projects" | "create_projects" | "delete_projects" | "view_settings" | "edit_company_settings"
          allowed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          manager_account_id: string
          permission_type: "view_projects" | "edit_projects" | "create_projects" | "delete_projects" | "view_settings" | "edit_company_settings"
          allowed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          manager_account_id?: string
          permission_type?: "view_projects" | "edit_projects" | "create_projects" | "delete_projects" | "view_settings" | "edit_company_settings"
          allowed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_permissions_manager_account_id_fkey"
            columns: ["manager_account_id"]
            isOneToOne: false
            referencedRelation: "manager_accounts"
            referencedColumns: ["id"]
          }
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      apartment_type: "apartment" | "commercial" | "parking"
      currency_type: "EUR" | "GEL" | "RUB" | "USD"
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
    Enums: {},
  },
} as const
