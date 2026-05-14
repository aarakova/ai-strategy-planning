import { api } from './client';

export type ContextPayload = {
  orientations: { vision: string; priority: 'Высокий' | 'Средний' | 'Низкий' }[];
  projects: {
    name: string;
    status: 'Завершено' | 'В работе' | 'Не начато';
    start_date: string;
    end_date: string;
    workload: { analysts: number; developers: number; testers: number };
    constraints?: string;
    deviations?: string;
    description?: string;
  }[];
  dependencies: { main_project_name: string; dependent_project_name: string }[];
  portfolio_constraints: {
    analysts_limit: number;
    developers_limit: number;
    testers_limit: number;
    critical_deadline: string;
  };
};

export const contextApi = {
  submit: (contextId: string, payload: ContextPayload) =>
    api.post<{ detail: string }>(`/contexts/${contextId}/context`, payload),
};
