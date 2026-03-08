export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface CRMConnection {
  id: string;
}

export interface ProjectCRMSettings {
  id?: string;
  pipeline_id?: number | null;
  status_id?: number | null;
  responsible_user_id?: number | null;
}

export interface AmoCRMPipeline {
  id: number;
  name: string;
  statuses: { id: number; name: string }[];
}

export interface AmoCRMUser {
  id: number;
  name: string;
}

export interface AmoCRMData {
  pipelines: AmoCRMPipeline[];
  users: AmoCRMUser[];
}

export interface AmoCRMProjectRowProps {
  project: Project;
  connection: CRMConnection;
  amoData: AmoCRMData | null;
  settings: ProjectCRMSettings | null;
  refreshSettings: () => Promise<void>;
}

export interface AmoCRMProjectListProps {
  connection: CRMConnection;
  open: boolean;
}
