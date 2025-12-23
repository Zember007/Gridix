import type { Lead as DbLead } from '@/entities/lead/queries/useLeads';

export type LeadSource = 'instagram' | 'website' | 'referral' | 'walk_in' | 'facebook';

export type TaskType = 'call' | 'meeting' | 'message' | 'payment' | 'other';

export interface LeadUser {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface LeadHistoryItem {
  id: string;
  type: 'status_change' | 'call' | 'note' | 'creation' | 'task_completion' | 'automation';
  date: string;
  text: string;
  user?: string;
}

export interface LeadTask {
  id: string;
  text: string;
  date: string; // ISO string
  time?: string; // HH:MM
  type: TaskType;
  completed: boolean;
  result?: string;
  assignedTo?: LeadUser;
}

export interface ExternalCrmStatus {
  connected: boolean;
  systemName?: 'AmoCRM' | 'Bitrix24';
  lastSync?: string;
  id?: string;
}

export interface ExtendedLead extends DbLead {
  project: string;
  apartment?: string;
  price?: number;
  crmStatus: ExternalCrmStatus;
  date: string;
  history: LeadHistoryItem[];
  tasks?: LeadTask[];
  assignedTo?: string;
  tags?: string[];
}

export interface Funnel {
  id: string;
  name: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  color: string;
}

export type FunnelTriggerEvent = 'on_stage_entry' | 'timer' | 'on_tag_add';

export interface FunnelTrigger {
  id: string;
  stageId: string;
  event: FunnelTriggerEvent;
  icon:
    | 'distribution'
    | 'task'
    | 'status_change'
    | 'edit_field'
    | 'add_tag'
    | 'notification'
    | 'apartment_status';
  title: string;
  description: string;
  subtext?: string;
  config?: Record<string, any>;
}

export interface LeadsFilters {
  source: string;
  minBudget: string;
  maxBudget: string;
  dateFrom: string;
  dateTo: string;
  stages: string[];
  assignedTo: string[];
}

export type SortOption = 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc';

export type CardField = 'none' | 'name' | 'project' | 'price' | 'tags' | 'assignedTo';

export interface CardAppearanceConfig {
  showAvatar: boolean;
  showDate: boolean;
  fields: CardField[];
}

// Temporary mock users for UI (will be replaced with real managers)
export const MOCK_USERS: LeadUser[] = [
  { id: 'u1', name: 'Я (Текущий)', initials: 'ME', color: 'bg-blue-600' },
  { id: 'u2', name: 'Nina S.', initials: 'NS', color: 'bg-purple-600' },
  { id: 'u3', name: 'David K.', initials: 'DK', color: 'bg-amber-600' },
  { id: 'u4', name: 'Admin', initials: 'AD', color: 'bg-slate-800' },
];
