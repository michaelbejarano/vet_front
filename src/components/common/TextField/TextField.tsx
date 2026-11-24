import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '@/utils/cn';
import styles from './TextField.module.css';

export interface TextFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  invalid?: boolean;
  endAdornment?: ReactNode;
}

export default function TextField({
  label,
  error,
  invalid = false,
  endAdornment,
  className,
  id,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hasError = invalid || Boolean(error);

  return (
    <div className={cn(styles.field, className)}>
      <label
        htmlFor={inputId}
        className={styles.label}
      >
        {label}

        {inputProps.required && (
          <span className={styles.required}> *</span>
        )}
      </label>

      <div
        className={cn(
          styles.control,
          hasError && styles.invalid,
          inputProps.disabled && styles.disabled
        )}
      >
        <input
          {...inputProps}
          id={inputId}
          className={styles.input}
          aria-invalid={hasError}
          aria-describedby={
            error ? errorId : inputProps['aria-describedby']
          }
        />

        {endAdornment}
      </div>

      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}