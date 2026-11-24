import { NavLink } from 'react-router-dom';

import {
  PawPrint,
  X,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/hooks/useSidebar';

import { navigation } from '@/data/navigation';
import { hasPermission } from '@/config/permissions';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';

import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user } = useAuth();

  const {
    isCollapsed,
    mobileOpen,
    closeMobile,
  } = useSidebar();

  if (!user) return null;

  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasPermission(
          user.roleName,
          item.permission
        )
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={closeMobile}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={cn(
          styles.sidebar,
          isCollapsed && styles.collapsed,
          mobileOpen && styles.mobileOpen
        )}
      >
        <div className={styles.brandHeader}>
          <NavLink
            to={PATHS.DASHBOARD}
            className={styles.brand}
            aria-label="VetCare - Inicio"
            onClick={closeMobile}
          >
            <div className={styles.logo}>
              <PawPrint size={25} />
            </div>

            <span className={styles.brandName}>
              VetCare
            </span>
          </NavLink>

          <button
            type="button"
            className={styles.closeButton}
            onClick={closeMobile}
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        <nav
          className={styles.navigation}
          aria-label="Navegación principal"
        >
          {visibleGroups.map((group) => (
            <div
              key={group.title}
              className={styles.group}
            >
              <span className={styles.groupTitle}>
                {group.title}
              </span>

              <ul className={styles.items}>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        title={item.label}
                        aria-label={item.label}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          cn(
                            styles.link,
                            isActive && styles.active
                          )
                        }
                      >
                        <Icon size={19} />

                        <span className={styles.label}>
                          {item.label}
                        </span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <footer className={styles.footer}>
          <span className={styles.footerText}>
            VetCare · Versión 1.0
          </span>
        </footer>
      </aside>
    </>
  );
}