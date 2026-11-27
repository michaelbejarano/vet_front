import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  UsersRound,
  UserCheck,
  UserX,
  RefreshCw,
  LoaderCircle,
  Search,
  Plus,
  Pencil,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';

import Button from '@/components/common/Button';
import StatCard from '@/components/common/StatCard';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import UserForm from './components/UserForm';

import { userService } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { getApiError } from '@/utils/apiError';

import {
  ROLES,
  ROLE_IDS,
  ROLE_LABELS,
  getRoleLabel,
  getAssignableRoles,
  canManageUser,
} from '@/config/roles';

import type { User } from '@/types/user.types';

import styles from './UsersPage.module.css';

export default function UsersPage() {
  const { user } = useAuth();

  // ========================================
  // ESTADOS DEL LISTADO
  // ========================================

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ========================================
  // FILTROS
  // ========================================

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // ========================================
  // FORMULARIO
  // ========================================

  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  // ========================================
  // CONFIRMACIÓN
  // ========================================

  const [targetUser, setTargetUser] =
    useState<User | null>(null);

  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // ========================================
  // PERMISOS
  // ========================================

  const canCreate = user
    ? getAssignableRoles(user.roleName).length > 0
    : false;

  function canManage(target: User): boolean {
    return user
      ? canManageUser(
          user.roleName,
          user.id,
          target.id,
          target.roleId
        )
      : false;
  }

  // ========================================
  // CARGAR USUARIOS
  // ========================================

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await userService.getAll();

      setUsers(data);
    } catch (error) {
      setError(
        getApiError(
          error,
          'No se pudieron cargar los usuarios.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // ========================================
  // INDICADORES
  // ========================================

  const activeUsers = users.filter(
    (item) => item.isActive
  ).length;

  const inactiveUsers = users.length - activeUsers;

  // ========================================
  // FILTRAR USUARIOS
  // ========================================

  const filteredUsers = users.filter((item) => {
    const matchesSearch = item.email
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      status === 'all' ||
      (status === 'active' && item.isActive) ||
      (status === 'inactive' && !item.isActive);

    const matchesRole =
      roleFilter === 'all' ||
      item.roleId === Number(roleFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesRole
    );
  });

  const roleOptions = [
    {
      value: 'all',
      label: 'Todos los roles',
    },
    ...Object.values(ROLES).map((role) => ({
      value: String(ROLE_IDS[role]),
      label: ROLE_LABELS[role],
    })),
  ];

  // ========================================
  // REGISTRAR
  // ========================================

  function handleOpenCreate() {
    if (!canCreate) return;

    setSuccess('');
    setEditingUser(null);
    setFormOpen(true);
  }

  // ========================================
  // EDITAR
  // ========================================

  function handleOpenEdit(target: User) {
    if (!canManage(target)) return;

    setSuccess('');
    setEditingUser(target);
    setFormOpen(true);
  }

  function handleCloseForm() {
    if (formBusy) return;

    setFormOpen(false);
    setEditingUser(null);
  }

  function handleFormSuccess(message: string) {
    setFormOpen(false);
    setFormBusy(false);
    setEditingUser(null);
    setSuccess(message);

    setSearch('');
    setStatus('all');
    setRoleFilter('all');

    void loadUsers();
  }

  // ========================================
  // DESACTIVAR Y REACTIVAR
  // ========================================

  function handleOpenConfirm(target: User) {
    if (!canManage(target)) return;

    setSuccess('');
    setConfirmError('');
    setTargetUser(target);
  }

  function handleCloseConfirm() {
    if (confirmBusy) return;

    setTargetUser(null);
    setConfirmError('');
  }

  async function handleChangeStatus() {
    if (
      !targetUser ||
      confirmBusy ||
      !canManage(targetUser)
    ) {
      return;
    }

    setConfirmBusy(true);
    setConfirmError('');

    try {
      if (targetUser.isActive) {
        // DELETE realiza desactivación lógica.
        await userService.remove(targetUser.id);

        setSuccess(
          'Usuario desactivado correctamente.'
        );
      } else {
        // Obtener los datos actuales antes de reactivar.
        const currentUser = await userService.getById(
          targetUser.id
        );

        if (!canManage(currentUser)) {
          setConfirmError(
            'No tienes permiso para administrar este usuario.'
          );

          return;
        }

        // PUT permite reactivar el usuario.
        await userService.update({
          id: currentUser.id,
          email: currentUser.email,
          roleId: currentUser.roleId,
          isActive: true,
        });

        setSuccess(
          'Usuario reactivado correctamente.'
        );
      }

      setTargetUser(null);

      void loadUsers();
    } catch (error) {
      setConfirmError(
        getApiError(
          error,
          'No se pudo cambiar el estado del usuario.'
        )
      );
    } finally {
      setConfirmBusy(false);
    }
  }

  // ========================================
  // COLUMNAS DE LA TABLA
  // ========================================

  const columns: Column<User>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (item) => item.id,
    },
    {
      key: 'email',
      header: 'Correo electrónico',
      render: (item) => item.email,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (item) => getRoleLabel(item.roleId),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <StatusBadge
          label={item.isActive ? 'Activo' : 'Inactivo'}
          variant={item.isActive ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (item) => {
        if (item.id === user?.id) {
          return (
            <span className={styles.ownAccount}>
              Tu cuenta
            </span>
          );
        }

        if (!canManage(item)) {
          return (
            <span className={styles.ownAccount}>
              Sin permisos
            </span>
          );
        }

        return (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.editButton}
              title="Editar usuario"
              aria-label={`Editar ${item.email}`}
              onClick={() => handleOpenEdit(item)}
            >
              <Pencil size={17} />
            </button>

            <button
              type="button"
              className={
                item.isActive
                  ? styles.deactivateButton
                  : styles.activateButton
              }
              title={
                item.isActive
                  ? 'Desactivar usuario'
                  : 'Reactivar usuario'
              }
              aria-label={
                item.isActive
                  ? `Desactivar ${item.email}`
                  : `Reactivar ${item.email}`
              }
              onClick={() => handleOpenConfirm(item)}
            >
              {item.isActive
                ? <UserX size={17} />
                : <UserCheck size={17} />}
            </button>
          </div>
        );
      },
    },
  ];

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios y accesos del sistema."
        actions={
          <>
            <Button
              variant="outline"
              loading={loading}
              leftIcon={<RefreshCw size={17} />}
              onClick={() => void loadUsers()}
            >
              Actualizar
            </Button>

            {canCreate && (
              <Button
                leftIcon={<Plus size={18} />}
                onClick={handleOpenCreate}
              >
                Nuevo usuario
              </Button>
            )}
          </>
        }
      />

      {/* Mensaje de éxito */}
      {success && (
        <div className={styles.success} role="status">
          <span>{success}</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess('')}
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* Indicadores */}
      {!loading && !error && (
        <section
          className={styles.stats}
          aria-label="Indicadores de usuarios"
        >
          <StatCard
            label="Total de usuarios"
            value={users.length}
            description="Usuarios registrados"
            icon={UsersRound}
            variant="primary"
          />

          <StatCard
            label="Usuarios activos"
            value={activeUsers}
            description="Con acceso habilitado"
            icon={UserCheck}
            variant="success"
          />

          <StatCard
            label="Usuarios inactivos"
            value={inactiveUsers}
            description="Con acceso deshabilitado"
            icon={UserX}
            variant="warning"
          />
        </section>
      )}

      {/* Listado */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Listado de usuarios</h2>

          <p>
            Consulta los usuarios registrados en VetCare.
          </p>
        </div>

        {/* Filtros */}
        <div className={styles.filters}>
          <TextField
            label="Buscar usuario"
            placeholder="Buscar por correo..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            endAdornment={
              <Search
                size={18}
                className={styles.searchIcon}
                aria-hidden="true"
              />
            }
          />

          <SelectField
            label="Rol"
            options={roleOptions}
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          />

          <SelectField
            label="Estado"
            options={[
              {
                value: 'all',
                label: 'Todos los estados',
              },
              {
                value: 'active',
                label: 'Activos',
              },
              {
                value: 'inactive',
                label: 'Inactivos',
              },
            ]}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          />
        </div>

        {/* Carga, errores y tabla */}
        {loading ? (
          <div className={styles.loading} role="status">
            <LoaderCircle
              size={28}
              className={styles.spinner}
            />

            <p>Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className={styles.error} role="alert">
            <p>{error}</p>

            <Button
              variant="outline"
              onClick={() => void loadUsers()}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filteredUsers}
              rowKey={(item) => item.id}
              ariaLabel="Listado de usuarios"
              emptyMessage="No se encontraron usuarios."
            />

            <p className={styles.results}>
              Mostrando {filteredUsers.length} de{' '}
              {users.length} usuarios
            </p>
          </>
        )}
      </section>

      {/* Modal de registro y edición */}
      <Modal
        open={formOpen}
        title={
          editingUser
            ? 'Editar usuario'
            : 'Nuevo usuario'
        }
        description={
          editingUser
            ? 'Actualiza los datos y permisos del usuario.'
            : 'Registra un nuevo acceso al sistema.'
        }
        busy={formBusy}
        onClose={handleCloseForm}
      >
        {formOpen && (
          <UserForm
            key={editingUser?.id ?? 'create'}
            initialUser={editingUser ?? undefined}
            onCancel={handleCloseForm}
            onBusyChange={setFormBusy}
            onSuccess={handleFormSuccess}
          />
        )}
      </Modal>

      {/* Confirmación de cambio de estado */}
      <ConfirmDialog
        open={Boolean(targetUser)}
        title={
          targetUser?.isActive
            ? 'Desactivar usuario'
            : 'Reactivar usuario'
        }
        description={
          targetUser?.isActive
            ? `¿Estás seguro de desactivar a ${targetUser.email}? El usuario perderá el acceso al sistema, pero conservará su registro.`
            : `¿Deseas reactivar a ${targetUser?.email ?? ''}? El usuario volverá a tener acceso al sistema.`
        }
        confirmLabel={
          targetUser?.isActive
            ? 'Desactivar usuario'
            : 'Reactivar usuario'
        }
        variant={
          targetUser?.isActive
            ? 'danger'
            : 'primary'
        }
        loading={confirmBusy}
        error={confirmError}
        onCancel={handleCloseConfirm}
        onConfirm={() => void handleChangeStatus()}
      />
    </div>
  );
}