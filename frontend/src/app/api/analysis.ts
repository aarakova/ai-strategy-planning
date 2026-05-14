import { api } from './client';

export type AnalysisStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type AnalysisResult = {
  status: AnalysisStatus;
  risks?: { text: string; level: 'high' | 'medium' | 'low'; impact: string }[];
  scheduleAnalysis?: string[];
  resourceAnalysis?: {
    role: string;
    demand: string;
    limit: string;
    balance: string;
    status: 'ok' | 'warning' | 'critical';
  }[];
  deviationAnalysis?: {
    project: string;
    deviation: string;
    danger: string;
    transfer: string;
  }[];
  aiExplanation?: string;
  recommendations?: { title: string; text: string }[];
  error?: string;
};

export const analysisApi = {
  get: (contextId: string) =>
    api.get<AnalysisResult>(`/contexts/${contextId}/analysis`),
};
