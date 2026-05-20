export const apiRoutes = {
  session: {
    current: '/auth/me',
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    demo: '/auth/demo',
  },
  datasets: {
    preview: '/datasets/preview',
    draft: '/datasets/draft',
  },
  analyses: {
    list: '/analyses',
    details: (analysisId: string) => `/analyses/${analysisId}`,
    run: '/analyses/run',
  },
} as const;
