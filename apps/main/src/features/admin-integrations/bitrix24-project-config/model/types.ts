export interface CRMConnection {
  id: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export type ProjectBitrixSettings = {
  category_id: number | null;
  stage_id: string | null;
};

export type BitrixCategory = { id: number; name: string };
export type BitrixStage = { stageId: string; name: string };

export interface Bitrix24ProjectListProps {
  connection: CRMConnection;
  open: boolean;
}

export interface Bitrix24ProjectRowProps {
  project: Project;
  connection: CRMConnection;
}
