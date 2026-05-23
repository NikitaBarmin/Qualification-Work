export const apiRoutes = {
  session: {
    current: '/auth/me',
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    demo: '/auth/demo',
  },
  uploads: {
    preview: '/uploads/preview',
  },
  datasets: {
    list: '/datasets',
    create: '/datasets',
    details: (datasetId: string) => `/datasets/${datasetId}`,
    download: (datasetId: string) => `/datasets/${datasetId}/download`,
    versions: (datasetId: string) => `/datasets/${datasetId}/versions`,
    draft: (datasetId: string, versionId: string) =>
      `/datasets/${datasetId}/versions/${versionId}/draft`,
  },
  analyses: {
    list: '/analyses',
    details: (analysisId: string) => `/analyses/${analysisId}`,
    create: '/analyses',
  },
} as const;
