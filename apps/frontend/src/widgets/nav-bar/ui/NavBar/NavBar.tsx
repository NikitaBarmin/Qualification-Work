import { Button } from 'antd';
import classNames from 'classnames';
import { memo, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import analyticsIcon from '@/app/assets/header/analytics.svg';
import homeIcon from '@/app/assets/header/home.svg';
import howItWorksIcon from '@/app/assets/header/how-its-work.svg';
import datasetsIcon from '@/app/assets/header/my-datasets.svg';
import newAnalysisIcon from '@/app/assets/header/new-analyze.svg';
import settingsIcon from '@/app/assets/header/settings.svg';
import { useLogoutMutation } from '@/entities/session';
import { useAppSelector } from '@/shared/lib/store';

import styles from './NavBar.module.scss';

interface INavItem {
  path: string;
  label: string;
  icon: string;
  end?: boolean;
}

const NAV_ITEMS: INavItem[] = [
  {
    path: '/',
    label: 'Главная',
    icon: homeIcon,
    end: true,
  },
  {
    path: '/how-it-works',
    label: 'Как это работает',
    icon: howItWorksIcon,
  },
  {
    path: '/datasets',
    label: 'Мои датасеты',
    icon: datasetsIcon,
  },
  {
    path: '/analytics/new',
    label: 'Новая аналитика',
    icon: newAnalysisIcon,
  },
  {
    path: '/analytics',
    label: 'Аналитика',
    icon: analyticsIcon,
    end: true,
  },
  {
    path: '/settings',
    label: 'Настройки',
    icon: settingsIcon,
  },
];

const PAGE_TITLE_BY_PATH = new Map(NAV_ITEMS.map((item) => [item.path, item.label]));
const NESTED_NAV_ITEMS = NAV_ITEMS.filter((item) => item.path !== '/').sort(
  (left, right) => right.path.length - left.path.length,
);

function getPageTitle(pathname: string) {
  const exactMatch = PAGE_TITLE_BY_PATH.get(pathname);

  if (exactMatch) {
    return exactMatch;
  }

  const nestedMatch = NESTED_NAV_ITEMS.find((item) => pathname.startsWith(`${item.path}/`));

  return nestedMatch?.label ?? 'BusinessPulse';
}

interface INavBarLinkProps {
  item: INavItem;
}

const NavBarLink = memo(function NavBarLink({ item }: INavBarLinkProps) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => classNames(styles.link, isActive && styles.linkActive)}
    >
      <img className={styles.icon} src={item.icon} alt="" aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  );
});

export function NavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = useAppSelector((state) => state.session);
  const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  const handleLogout = async () => {
    await logout().unwrap();
    navigate('/', { replace: true });
  };

  return (
    <>
      <aside
        className={styles.sidebar}
        data-stack="v"
        data-gap="28"
        aria-label="Основная навигация"
      >
        <div className={styles.brand} data-stack="v" data-gap="4">
          <span className={styles.brandTitle}>BusinessPulse</span>
        </div>

        <nav className={styles.navigation}>
          {NAV_ITEMS.map((item) => (
            <NavBarLink key={item.path} item={item} />
          ))}
        </nav>
      </aside>

      <header className={styles.header} data-stack="h" data-align="center" data-justify="between">
        <div className={styles.pageTitle}>{pageTitle}</div>
        <div data-stack="h" data-align="center" style={{ gap: 10 }}>
          {session.status === 'authenticated' ? (
            <>
              <span className={styles.userEmail}>{session.user?.email}</span>
              <Button className={styles.authButton} loading={isLogoutLoading} onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button className={styles.authButton} onClick={() => navigate('/sign-in')}>
                Войти
              </Button>
              <Button
                type="primary"
                className={styles.authButton}
                onClick={() => navigate('/sign-up')}
              >
                Регистрация
              </Button>
            </>
          )}
        </div>
      </header>
    </>
  );
}
