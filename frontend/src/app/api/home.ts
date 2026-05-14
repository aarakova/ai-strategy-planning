import { api } from './client';

export type StageStatus = {
  stage_name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
};

export type HomeData = {
  portfolio_name: string;
  planning_stages_status: StageStatus[];
  key_risks: { text: string; level: 'high' | 'medium' | 'low'; impact: string }[];
  resource_analysis: {
    role: string;
    demand: string;
    limit: string;
    balance: string;
    status: 'ok' | 'warning' | 'critical';
  }[];
  strategic_goals: { id: string; specific: string; priority: string }[];
  plan_passport: unknown | null;
};

export const homeApi = {
  get: (contextId: string) =>
    api.get<HomeData>(`/contexts/${contextId}/home`),
};
