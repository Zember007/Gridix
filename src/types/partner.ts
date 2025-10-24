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
  payment_details?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerStats {
  total_clients: number;
  referral_clients: number;
  managed_clients: number;
  total_earned: number;
  total_withdrawn: number;
  available_for_withdrawal: number;
  commissions: Array<{
    partner_commission_amount: number;
    created_at: string;
  }>;
  clients: Array<{
    id: string;
    type: 'referral' | 'managed';
    status: string;
    created_at: string;
    client_id: string;
    user_profiles: {
      id: string;
      first_name: string;
      last_name: string;
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
  user_profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PartnerProgramRequest {
  action: 'track_referral' | 'get_stats' | 'admin_manage' | 'impersonate' | 'payout_request';
  partner_code?: string;
  partner_id?: string;
  client_id?: string;
  amount?: number;
  payment_method?: string;
  payment_details?: any;
  admin_action?: 'list' | 'update_percentage' | 'suspend' | 'activate';
  payout_percentage?: number;
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
  total_earned?: number;
  total_withdrawn?: number;
  available_for_withdrawal?: number;
  commissions?: Array<any>;
  clients?: Array<PartnerClient>;
}
