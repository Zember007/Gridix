export interface ManagerAccount {
  id: string;
  manager_id: string;
  email: string;
  full_name: string;
  phone?: string;
  status: "pending" | "active" | "suspended";
  invited_at: string;
  accepted_at?: string;
}

export interface NewManagerForm {
  email: string;
  full_name: string;
  phone: string;
}
