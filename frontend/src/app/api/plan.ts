import { api } from './client';

export type PlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type PlanCompositionItem = {
  project_name: string;
  share: number;
  roles: string;
};

export type PlanResourceItem = {
  role: string;
  required_hours: number;
  available_hours: number;
  loading_percent: number;
  loading_degree: string;
};

export type PlanCheckpoint = {
  name: string;
  date: string;
  status: string;
};

export type PlanStage = {
  stage_number: number;
  name: string;
  period: string;
  start_date: string;
  end_date: string;
  stage_status: string;
  checkpoint: PlanCheckpoint;
  composition: PlanCompositionItem[];
  resources: PlanResourceItem[];
};

export type PlanPassport = {
  selected_variant: string;
  planning_horizon_months: number;
  checkpoint_count: number;
  risk_count: number;
  constraints_in_attention_count: number;
  execution_progress: number;
};

export type PlanRisk = {
  risk: string;
  impact: 'Высокий' | 'Средний' | 'Низкий';
};

export type ConstraintInAttention = {
  constraint: string;
  actual_value: string;
  impact: string;
};

export type ResourceLoadingByStage = {
  stage_number: number;
  analysts_percent: number;
  developers_percent: number;
  testers_percent: number;
};

export type PlanData = {
  plan_passport: PlanPassport;
  stages: PlanStage[];
  resource_loading_by_stages: ResourceLoadingByStage[];
  plan_risks: PlanRisk[];
  constraints_in_attention: ConstraintInAttention[];
};

export type PlanResponse = {
  status: PlanStatus;
  plan: PlanData | null;
  error?: string | null;
};

export const planApi = {
  get: (contextId: string) => api.get<PlanResponse>(`/contexts/${contextId}/plan`),
};
