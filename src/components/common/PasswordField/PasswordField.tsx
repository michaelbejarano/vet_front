import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import TextField from '@/components/common/TextField';
import type { TextFieldProps } from '@/components/common/TextField';

import styles from './PasswordField.module.css';

type PasswordFieldProps = Omit<
  TextFieldProps,
  'type' | 'endAdornment'
>;

export default function PasswordField(
  props: PasswordFieldProps
) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          className={styles.toggle}
          disabled={props.disabled}
          onClick={() => setVisible((value) => !value)}
          aria-label={
            visible
              ? 'Ocultar contraseña'
              : 'Mostrar contraseña'
          }
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      }
    />
  );
}