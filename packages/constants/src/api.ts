export const API_PREFIX = '/api';

export const API_ROUTES = {
  health: `${API_PREFIX}/health`,
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    logout: `${API_PREFIX}/auth/logout`,
    session: `${API_PREFIX}/auth/session`,
  },
  datasets: {
    list: `${API_PREFIX}/datasets`,
    preview: `${API_PREFIX}/datasets/preview`,
    upload: `${API_PREFIX}/datasets/upload`,
  },
  analyses: {
    list: `${API_PREFIX}/analyses`,
    byId: (analysisId: string) => `${API_PREFIX}/analyses/${analysisId}`,
    run: `${API_PREFIX}/analyses/run`,
  },
} as const;
