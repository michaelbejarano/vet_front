import { useState } from 'react';
import type { FormEvent } from 'react';

import { Eye, EyeOff, Save } from 'lucide-react';

import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';

import {
  ROLE_IDS,
  ROLE_LABELS,
  getAssignableRoles,
  canManageUser,
} from '@/config/roles';

import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { getApiError } from '@/utils/apiError';

import type { User } from '@/types/user.types';

import styles from './UserForm.module.css';

interface UserFormProps {
  initialUser?: User;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onBusyChange: (busy: boolean) => void;
}

export default function UserForm({
  initialUser,
  onCancel,
  onSuccess,
  onBusyChange,
}: UserFormProps) {
  const { user } = useAuth();

  const isEditing = Boolean(initialUser);

  const [email, setEmail] = useState(
    initialUser?.email ?? ''
  );

  const [password, setPassword] = useState('');

  const [roleId, setRoleId] = useState(
    initialUser ? String(initialUser.roleId) : ''
  );

  const [isActive, setIsActive] = useState(
    initialUser?.isActive ?? true
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = user
    ? getAssignableRoles(user.roleName).map((role) => ({
        value: ROLE_IDS[role],
        label: ROLE_LABELS[role],
      }))
    : [];

  const canSubmit = Boolean(
    user &&
    roleOptions.length > 0 &&
    (
      !initialUser ||
      canManageUser(
        user.roleName,
        user.id,
        initialUser.id,
        initialUser.roleId
      )
    )
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || !canSubmit) return;

    setError('');

    if (!isEditing && password.length < 12) {
      setError(
        'La contraseña debe tener al menos 12 caracteres.'
      );

      return;
    }

    if (
      !roleOptions.some(
        (option) => option.value === Number(roleId)
      )
    ) {
      setError('Selecciona un rol permitido.');
      return;
    }

    setSaving(true);
    onBusyChange(true);

    let message: string;

    try {
      if (initialUser) {
        // Actualizar usuario existente.
        await userService.update({
          id: initialUser.id,
          email: email.trim(),
          roleId: Number(roleId),
          isActive,
        });

        message = 'Usuario actualizado correctamente.';
      } else {
        // Registrar nuevo usuario.
        const response = await userService.create({
          email: email.trim(),
          password,
          roleId: Number(roleId),
        });

        message = response.message;
      }
    } catch (error) {
      setError(
        getApiError(
          error,
          isEditing
            ? 'No se pudo actualizar el usuario.'
            : 'No se pudo registrar el usuario.'
        )
      );

      return;
    } finally {
      setSaving(false);
      onBusyChange(false);
    }

    onSuccess(message);
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <TextField
        label="Correo electrónico"
        type="email"
        placeholder="usuario@vetcare.pe"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        maxLength={200}
        autoComplete="off"
        disabled={saving}
        required
      />

      {/* Contraseña solo durante el registro */}
      {!isEditing && (
        <div className={styles.passwordField}>
          <TextField
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingresa una contraseña"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="new-password"
            minLength={12}
            disabled={saving}
            required
            endAdornment={
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                disabled={saving}
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            }
          />

          <p className={styles.hint}>
            Debe contener al menos 12 caracteres.
          </p>
        </div>
      )}

      <SelectField
        label="Rol"
        placeholder="Selecciona un rol"
        options={roleOptions}
        value={roleId}
        onChange={(event) =>
          setRoleId(event.target.value)
        }
        disabled={saving}
        required
      />

      {/* Estado solo durante la edición */}
      {isEditing ? (
        <SelectField
          label="Estado"
          options={[
            { value: 'true', label: 'Activo' },
            { value: 'false', label: 'Inactivo' },
          ]}
          value={String(isActive)}
          onChange={(event) =>
            setIsActive(event.target.value === 'true')
          }
          disabled={saving}
          required
        />
      ) : (
        <div className={styles.notice}>
          El usuario será registrado con estado activo.
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          loading={saving}
          leftIcon={<Save size={17} />}
          disabled={!canSubmit}
        >
          {isEditing
            ? 'Guardar cambios'
            : 'Registrar usuario'}
        </Button>
      </div>
    </form>
  );
}