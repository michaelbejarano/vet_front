import type { ReactNode } from 'react';

import {
  CircleAlert,
  CircleCheck,
  TriangleAlert,
  Info,
} from 'lucide-react';

import { cn } from '@/utils/cn';
import styles from './FormAlert.module.css';

type AlertVariant =
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

interface FormAlertProps {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
}

const icons = {
  error: CircleAlert,
  success: CircleCheck,
  warning: TriangleAlert,
  info: Info,
};

export default function FormAlert({
  variant = 'error',
  className,
  children,
}: FormAlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        styles.alert,
        styles[variant],
        className
      )}
      role={
        variant === 'error' ? 'alert' : 'status'
      }
    >
      <Icon
        size={18}
        className={styles.icon}
        aria-hidden="true"
      />

      <div>{children}</div>
    </div>
  );
}