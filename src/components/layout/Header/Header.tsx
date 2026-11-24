import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { useLocation } from 'react-router-dom';

import { useSidebar } from '@/hooks/useSidebar';
import { navigation } from '@/data/navigation';

import UserProfilePopover
  from '@/components/layout/UserProfilePopover';

import styles from './Header.module.css';

export default function Header() {
  const {
    isCollapsed,
    toggleCollapse,
    toggleMobile,
  } = useSidebar();

  const location = useLocation();

  const currentPage = navigation
    .flatMap((group) => group.items)
    .find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(
          `${item.path}/`
        )
    );

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={`${styles.menuButton} ${styles.desktopButton}`}
          onClick={toggleCollapse}
          aria-label={
            isCollapsed
              ? 'Expandir menú'
              : 'Colapsar menú'
          }
          aria-expanded={!isCollapsed}
        >
          {isCollapsed
            ? <PanelLeftOpen size={22} />
            : <PanelLeftClose size={22} />}
        </button>

        <button
          type="button"
          className={`${styles.menuButton} ${styles.mobileButton}`}
          onClick={toggleMobile}
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>

        <div className={styles.separator} />

        <span className={styles.pageTitle}>
          {currentPage?.label ?? 'VetCare'}
        </span>
      </div>

      <div className={styles.right}>
        <UserProfilePopover />
      </div>
    </header>
  );
}