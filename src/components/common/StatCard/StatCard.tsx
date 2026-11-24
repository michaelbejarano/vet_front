import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils/cn';

import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  variant = 'primary',
}: StatCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>
          {label}
        </span>

        <div
          className={cn(
            styles.icon,
            styles[variant]
          )}
        >
          <Icon size={21} />
        </div>
      </div>

      <strong className={styles.value}>
        {value}
      </strong>

      {description && (
        <p className={styles.description}>
          {description}
        </p>
      )}
    </article>
  );
}