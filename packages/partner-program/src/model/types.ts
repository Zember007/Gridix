export interface PartnerProfile {
  id: string;
  user_id: string;
  partner_code: string;
  total_earned: number;
  total_withdrawn: number;
  status: "active" | "suspended" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface PartnerLink {
  id: string;
  partner_id: string;
  client_id: string;
  type: "referral" | "managed";
  status: "active" | "suspended" | "terminated";
  created_at: string;
  accepted_at?: string;
}

export interface PartnerCommission {
  id: string;
  partner_id: string;
  client_id: string;
  subscription_id: string;
  amount: number;
  percentage: number;
  type: "referral" | "managed";
  status: "pending" | "paid" | "cancelled";
  paid_at?: string;
  created_at: string;
}

export interface PartnerPayout {
  id: string;
  partner_id: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  requested_at: string;
  processed_at?: string;
  payment_method?: string;
  contact_info?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerIncomePoint {
  date: string; // ISO date string (YYYY-MM-DD)
  amount: number;
}

export interface PartnerTransaction {
  date: string; // formatted date DD.MM.YYYY
  sum: number;
  balance: number;
  comment: string;
}

export interface PartnerStats {
  total_clients: number;
  referral_clients: number;
  managed_clients: number;
  total_earned: number;
  total_withdrawn: number;
  available_for_withdrawal: number;
  total_clicks: number;
  /** Агрегация кликов по utm_source, utm_medium, utm_campaign */
  traffic_by_source?: Array<{ source: string; count: number }>;
  traffic_by_medium?: Array<{ source: string; count: number }>;
  traffic_by_campaign?: Array<{ source: string; count: number }>;
  // Проценты комиссии, рассчитанные той же логикой, что и calculate_and_award_partner_commission
  commission_percentage_referral?: number | null;
  commission_percentage_managed?: number | null;
  commissions: Array<{
    partner_commission_amount: number;
    created_at: string;
  }>;
  income_history?: PartnerIncomePoint[];
  transactions?: PartnerTransaction[];
  funnel_registrations?: number;
  funnel_paying_clients?: number;
  // Информация по партнёрским уровням (рассчитана целиком на бэкенде)
  total_projects?: number;
  active_clients?: number;
  partner_level?: string | null;
  partner_level_key?: "bronze" | "silver" | "gold" | null;
  next_level_name?: string | null;
  next_level_required_active_clients?: number | null;
  clients_to_next_level?: number | null;
  clients: Array<{
    id: string;
    type: "referral" | "managed";
    status: string;
    created_at: string;
    client_id: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    subscription_status?: string | null;
    subscription_expires_at?: string | null;
    // Детальная информация по активным проектам клиента (для витрины партнёра)
    projects?: Array<{
      id: string;
      name: string;
      subscription_status?: string | null;
      subscription_expires_at?: string | null;
    }>;
    user_profiles: {
      id: string;
      full_name: string | null;
      email: string;
    };
  }>;
}

export interface PartnerClient {
  id: string;
  type: "referral" | "managed";
  status: string;
  created_at: string;
  client_id: string;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  // Детальная информация по проектам клиента (для вкладки «Клиенты» в партнёрском кабинете)
  projects?: Array<{
    id: string;
    name: string;
    subscription_status?: string | null;
    subscription_expires_at?: string | null;
  }>;
  user_profiles: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface PartnerProgramRequest {
  action:
    | "track_click"
    | "track_referral"
    | "get_stats"
    | "admin_manage"
    | "impersonate"
    | "payout_request";
  partner_code?: string;
  partner_id?: string;
  client_id?: string;
  amount?: number;
  payment_method?: string;
  contact_info?: string;
  admin_action?: "list" | "update_percentage" | "suspend" | "activate";
  payout_percentage?: number;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export interface PartnerProgramResponse {
  success?: boolean;
  error?: string;
  partner_name?: string;
  link_id?: string;
  partners?: PartnerProfile[];
  redirect_url?: string;
  payout_id?: string;
  total_clients?: number;
  referral_clients?: number;
  managed_clients?: number;
  total_clicks?: number;
  traffic_by_source?: Array<{ source: string; count: number }>;
  traffic_by_medium?: Array<{ source: string; count: number }>;
  traffic_by_campaign?: Array<{ source: string; count: number }>;
  total_earned?: number;
  total_withdrawn?: number;
  available_for_withdrawal?: number;
  commissions?: Array<{
    partner_commission_amount: number;
    created_at: string;
  }>;
  income_history?: PartnerIncomePoint[];
  transactions?: PartnerTransaction[];
  funnel_registrations?: number;
  funnel_paying_clients?: number;
  clients?: Array<PartnerClient>;
  commission_percentage_referral?: number | null;
  commission_percentage_managed?: number | null;
  total_projects?: number;
  active_clients?: number;
  partner_level?: string | null;
  partner_level_key?: "bronze" | "silver" | "gold" | null;
  next_level_name?: string | null;
  next_level_required_active_clients?: number | null;
  clients_to_next_level?: number | null;
}
