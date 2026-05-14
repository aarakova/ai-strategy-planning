import { api } from './client';

export type Multiproject = {
  id: string;
  name: string;
  planningHorizon: string;
  createdAt: string;
};

type BackendContext = {
  id: string;
  portfolio_name: string;
  planning_horizon: string;
  planning_stages_status: Array<{ stage_name: string; status: string }>;
  created_at: string;
};

function toMultiproject(c: BackendContext): Multiproject {
  return {
    id: c.id,
    name: c.portfolio_name,
    planningHorizon: c.planning_horizon,
    createdAt: c.created_at.slice(0, 10),
  };
}

export const contextsApi = {
  list: () =>
    api.get<BackendContext[]>('/contexts').then((list) => list.map(toMultiproject)),

  create: (name: string, planningHorizon: string) =>
    api
      .post<BackendContext>('/contexts', {
        portfolio_name: name,
        planning_horizon: planningHorizon,
      })
      .then(toMultiproject),

  delete: (id: string) => api.del(`/contexts/${id}`),
};
