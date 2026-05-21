import { Outlet, useLocation } from 'react-router-dom';

import { NavBar } from '@/widgets/nav-bar';

import styles from './AppLayout.module.scss';

const authRoutes = new Set(['/sign-in', '/sign-up']);

export function AppLayout() {
  const { pathname } = useLocation();
  const isAuthRoute = authRoutes.has(pathname);

  if (isAuthRoute) {
    return (
      <main className={styles.authPage}>
        <div className={styles.authContent}>
          <Outlet />
        </div>
      </main>
    );
  }

  return (
    <div className={styles.layout}>
      <NavBar />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
