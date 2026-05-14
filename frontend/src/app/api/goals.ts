import { api } from './client';

export type GoalItem = {
  specific: string;
  kpi_name: string;
  kpi_target_value: number;
  kpi_unit: string;
  achievable: string;
  timebound: string;
  priority: 'Высокий' | 'Средний' | 'Низкий';
  orientation_ids?: string[];
  project_names?: string[];
  orientation_explanation?: string;
};

export type GoalResponseItem = GoalItem & {
  id: string;
  context: 'USER_CREATED' | 'AI_SUGGESTED';
  ai_explanation?: string;
  project_coverage?: { degree: string; explanation: string };
  realism_check?: { degree: string; score: number; issues: string[] };
};

export const goalsApi = {
  list: (contextId: string) =>
    api.get<{ goals: GoalResponseItem[] }>(`/contexts/${contextId}/goals`),
  submit: (contextId: string, goals: GoalItem[]) =>
    api.post<{ goals: GoalResponseItem[] }>(`/contexts/${contextId}/goals`, { goals }),
  suggestions: (contextId: string) =>
    api.get<{ ai_suggestions: GoalResponseItem[] }>(`/contexts/${contextId}/goals/suggestions`),
};
