export interface PartnerProfile {
  id: string;
  user_id: string;
  partner_code: string;
  total_earned: number;
  total_withdrawn: number;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PartnerLink {
  id: string;
  partner_id: string;
  client_id: string;
  type: 'referral' | 'managed';
  status: 'active' | 'suspended' | 'terminated';
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
  type: 'referral' | 'managed';
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  created_at: string;
}

export interface PartnerPayout {
  id: string;
  partner_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
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
  commissions: Array<{
    partner_commission_amount: number;
    created_at: string;
  }>;
  income_history?: PartnerIncomePoint[];
  transactions?: PartnerTransaction[];
  funnel_registrations?: number;
  funnel_paying_clients?: number;
  clients: Array<{
    id: string;
    type: 'referral' | 'managed';
    status: string;
    created_at: string;
    client_id: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    subscription_status?: string | null;
    subscription_expires_at?: string | null;
    user_profiles: {
      id: string;
      full_name: string | null;
      email: string;
    };
  }>;
}

export interface PartnerClient {
  id: string;
  type: 'referral' | 'managed';
  status: string;
  created_at: string;
  client_id: string;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  user_profiles: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface PartnerProgramRequest {
  action: 'track_click' | 'track_referral' | 'get_stats' | 'admin_manage' | 'impersonate' | 'payout_request';
  partner_code?: string;
  partner_id?: string;
  client_id?: string;
  amount?: number;
  payment_method?: string;
  contact_info?: string;
  admin_action?: 'list' | 'update_percentage' | 'suspend' | 'activate';
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
}
