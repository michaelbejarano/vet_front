import { useState } from 'react';
import type { FormEvent } from 'react';

import axios from 'axios';
import { LogIn } from 'lucide-react';

import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import PasswordField from '@/components/common/PasswordField';
import FormAlert from '@/components/common/FormAlert';

import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/validators';

import styles from './LoginForm.module.css';

interface LoginFormProps {
  onSuccess: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginForm({
  onSuccess,
}: LoginFormProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email =
        'El correo electrónico es obligatorio.';
    } else if (!isValidEmail(email)) {
      nextErrors.email =
        'Ingresa un correo electrónico válido.';
    }

    if (!password) {
      nextErrors.password =
        'La contraseña es obligatoria.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setFormError('');

    if (!validate()) return;

    setLoading(true);

    try {
      await login(
        email.trim().toLowerCase(),
        password
      );

      onSuccess();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          setFormError(
            'Credenciales incorrectas o sesión inválida.'
          );
        } else if (status === 400) {
          setFormError(
            'Revisa los datos ingresados.'
          );
        } else if (!error.response) {
          setFormError(
            'No se pudo conectar con el servidor. Inténtalo nuevamente.'
          );
        } else {
          setFormError(
            'Ocurrió un error en el servidor.'
          );
        }
      } else {
        setFormError(
          'No se pudo iniciar sesión.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      {formError && (
        <FormAlert variant="error">
          {formError}
        </FormAlert>
      )}

      <TextField
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="correo@vetcare.com"
        value={email}
        error={errors.email}
        disabled={loading}
        required
        onChange={(event) => {
          setEmail(event.target.value);

          setErrors((current) => ({
            ...current,
            email: undefined,
          }));

          setFormError('');
        }}
      />

      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        placeholder="Ingresa tu contraseña"
        value={password}
        error={errors.password}
        disabled={loading}
        required
        onChange={(event) => {
          setPassword(event.target.value);

          setErrors((current) => ({
            ...current,
            password: undefined,
          }));

          setFormError('');
        }}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={loading}
        leftIcon={<LogIn size={18} />}
      >
        {loading
          ? 'Iniciando sesión...'
          : 'Iniciar sesión'}
      </Button>
    </form>
  );
}