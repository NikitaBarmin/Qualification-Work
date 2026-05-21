import { Link } from 'react-router-dom';

import styles from './AppFooter.module.scss';

const footerLinks = [
  { label: 'Политика конфиденциальности', to: '/privacy' },
  { label: 'Условия использования', to: '/terms' },
  { label: 'Документация', to: '/docs' },
  { label: 'Поддержка', to: '/support' },
];

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner} data-stack="h" data-align="center">
        <div className={styles.brand}>BusinessPulse</div>

        <nav className={styles.links} data-stack="h" data-gap="28" aria-label="Навигация в футере">
          {footerLinks.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.meta}>© 2026 BusinessPulse. Все права защищены.</div>
      </div>
    </footer>
  );
}
