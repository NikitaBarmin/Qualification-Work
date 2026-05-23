export const API_PREFIX = '/api';

export const API_ROUTES = {
  health: `${API_PREFIX}/health`,
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    logout: `${API_PREFIX}/auth/logout`,
    me: `${API_PREFIX}/auth/me`,
  },
  uploads: {
    preview: `${API_PREFIX}/uploads/preview`,
  },
  datasets: {
    list: `${API_PREFIX}/datasets`,
    byId: (datasetId: string) => `${API_PREFIX}/datasets/${datasetId}`,
    versions: (datasetId: string) => `${API_PREFIX}/datasets/${datasetId}/versions`,
  },
  analyses: {
    list: `${API_PREFIX}/analyses`,
    byId: (analysisId: string) => `${API_PREFIX}/analyses/${analysisId}`,
  },
} as const;
