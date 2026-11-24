import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ChevronDown,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/config/roles';

import styles from './UserProfilePopover.module.css';

export default function UserProfilePopover() {
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutside
    );

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutside
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen]);

  if (!user) return null;

  const roleLabel =
    ROLE_LABELS[user.roleName] ?? user.roleName;

  const initials = roleLabel
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={containerRef}
      className={styles.container}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Perfil del usuario"
      >
        <div className={styles.avatar}>
          {initials}
        </div>

        <div className={styles.userInfo}>
          <span className={styles.role}>
            {roleLabel}
          </span>

          <span className={styles.email}>
            {user.email}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={styles.chevron}
        />
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.profile}>
            <strong>{roleLabel}</strong>
            <span>{user.email}</span>
          </div>

          <div className={styles.roleInfo}>
            <ShieldCheck size={16} />
            {user.roleName}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.logout}
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}