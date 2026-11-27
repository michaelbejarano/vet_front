import { cn } from '@/utils/cn';

import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  label: string;
  variant?:
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'neutral';
}

export default function StatusBadge({
  label,
  variant = 'neutral',
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        styles.badge,
        styles[variant]
      )}
    >
      <span
        className={styles.dot}
        aria-hidden="true"
      />

      {label}
    </span>
  );
}