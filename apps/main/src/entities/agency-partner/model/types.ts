export interface AgencyPartner {
  id: string;
  name: string;
  type: "agency" | "individual";
  contactPerson: string;
  phone: string;
  email: string;
  status: "active" | "pending" | "blocked" | "needs_correction";
  rejectionReason?: string;
  commissionRate: number;
  source: string;
  joinedAt: string;
  agreementSigned: boolean;
  bankDetails?: {
    details?: string;
    bank_name?: string | null;
    iban?: string | null;
    billing_currency?: string | null;
    is_vat_payer?: boolean | null;
  };
  stats: {
    totalLeads: number;
    activeDeals: number;
    closedDeals: number;
    totalRevenue: number;
    commissionPaid: number;
    commissionPending: number;
  };
  payouts?: PartnerPayout[];
}

export interface PartnerPayout {
  id: string;
  partnerId: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "rejected";
  method: string;
}

export interface PartnerFilter {
  search: string;
  status: "all" | "active" | "pending" | "blocked" | "needs_correction";
  type: "all" | "agency" | "individual";
  minCommission?: number;
  maxCommission?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface PayoutItem {
  id: string;
  amount: number;
  date: string;
  leadName: string | null;
  leadId: string | null;
}
