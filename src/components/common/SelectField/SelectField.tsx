import { useId } from 'react';

import type {
  SelectHTMLAttributes,
} from 'react';

import styles from './SelectField.module.css';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export default function SelectField({
  label,
  options,
  placeholder,
  error,
  id,
  required,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId}>
        {label}

        {required && (
          <span className={styles.required}>
            {' *'}
          </span>
        )}
      </label>

      <select
        {...props}
        id={fieldId}
        required={required}
        className={styles.select}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${fieldId}-error` : undefined
        }
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p
          id={`${fieldId}-error`}
          className={styles.error}
        >
          {error}
        </p>
      )}
    </div>
  );
}