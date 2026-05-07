export type ProjectAccessStatus = "active" | "inactive" | "no_subscription";
export type PlanTier = "basic" | "pro" | null;

export interface AdminProjectAccess {
  active_project_ids: string[];
  inactive_project_ids: string[];
  has_any_active_project: boolean;
  has_any_project: boolean;
}

export interface AdminCapabilities {
  can_view_analytics: boolean;
  can_view_leads: boolean;
  can_use_widgets: boolean;
  can_use_integrations: boolean;
  editable_project_ids: string[];
  widget_project_ids: string[];
  crm_integration_project_ids: string[];
  custom_domain_project_ids: string[];
  white_label_project_ids: string[];
  advanced_analytics_project_ids: string[];
  partner_module_project_ids: string[];
  mass_action_project_ids: string[];
}

export interface AdminBootstrapProject {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  floors: number;
  slug: string | null;
  building_image_url: string | null;
  created_at: string;
  user_id: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  access_status: ProjectAccessStatus;
  plan_tier: PlanTier;
  developer_info?: {
    full_name: string;
    company_name: string;
  };
}

export interface AdminBootstrapSubscription {
  id: string | null;
  status: string | null;
  current_period_end: string | null;
  plan_id: string | null;
  plan_tier: PlanTier;
  payment_method: string | null;
}

export interface AdminBootstrapResponse {
  viewer: {
    user_id: string;
    role: "developer" | "manager";
    effective_developer_id: string;
    is_manager_mode: boolean;
    /** True when the active workspace belongs to the designated demo developer account. */
    is_demo_workspace?: boolean;
    /** True when the current user is a read-only demo viewer (not superadmin/admin). */
    is_demo_viewer?: boolean;
  };
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
  } | null;
  /** Выполненные интерактивные туры (Driver.js) для текущего пользователя: tour_id → ISO timestamp. */
  completed_interactive_tours: Record<string, string>;
  projects: AdminBootstrapProject[];
  subscriptions_by_project: Record<string, AdminBootstrapSubscription>;
  access: AdminProjectAccess;
  capabilities: AdminCapabilities;
}
