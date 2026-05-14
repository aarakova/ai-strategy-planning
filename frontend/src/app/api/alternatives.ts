import { api } from './client';

export type AlternativeStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type ApiScenarioProject = {
  project_name: string;
  dependency_note: string;
  period: string;
  description: string;
  resources: { analysts: number; developers: number; testers: number };
};

export type ApiScenario = {
  type: 'BALANCED' | 'CONSERVATIVE' | 'RISKY';
  name: string;
  description: string;
  ai_interpretation: string;
  total_duration_months: number;
  risk_count: number;
  constraint_compliance_percent: number;
  resource_feasibility_percent: number;
  strengths: string[];
  weaknesses: string[];
  total_resources: { analysts: number; developers: number; testers: number };
  key_risks: { text: string; level: 'high' | 'medium' | 'low'; impact: string }[];
  complied_constraints: string[];
  constraints_in_attention: string[];
  projects: ApiScenarioProject[];
};

export type AlternativesData = {
  status: AlternativeStatus;
  scenarios: ApiScenario[];
  selected_scenario_id: string | null;
  error?: string | null;
};

export const alternativesApi = {
  get: (contextId: string) =>
    api.get<AlternativesData>(`/contexts/${contextId}/alternatives`),
  generate: (contextId: string) =>
    api.post<{ detail: string }>(`/contexts/${contextId}/alternatives/generate`, {}),
  select: (contextId: string, scenarioId: string) =>
    api.post<{ detail: string }>(`/contexts/${contextId}/alternatives`, {
      scenario_id: scenarioId,
    }),
};
