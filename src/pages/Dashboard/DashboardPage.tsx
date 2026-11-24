import {
  CalendarDays,
  PawPrint,
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  UsersRound,
  Package,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import StatCard from '@/components/common/StatCard';

import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/config/roles';

import {
  hasPermission,
  PERMISSIONS,
} from '@/config/permissions';

import { PATHS } from '@/routes/paths';

import styles from './DashboardPage.module.css';

const stats = [
  {
    label: 'Citas de hoy',
    value: '—',
    description: 'Citas programadas',
    icon: CalendarDays,
    variant: 'primary',
    permission: PERMISSIONS.APPOINTMENTS,
  },
  {
    label: 'Mascotas registradas',
    value: '—',
    description: 'Total de pacientes',
    icon: PawPrint,
    variant: 'info',
    permission: PERMISSIONS.PETS,
  },
  {
    label: 'Ventas del día',
    value: 'S/ —',
    description: 'Ingresos por ventas',
    icon: ShoppingCart,
    variant: 'success',
    permission: PERMISSIONS.SALES,
  },
  {
    label: 'Caja actual',
    value: '—',
    description: 'Estado de la sesión de caja',
    icon: Wallet,
    variant: 'warning',
    permission: PERMISSIONS.CASH,
  },
] as const;

const quickActions = [
  {
    label: 'Gestionar citas',
    description: 'Consulta la agenda veterinaria',
    icon: CalendarDays,
    path: PATHS.APPOINTMENTS,
    permission: PERMISSIONS.APPOINTMENTS,
  },
  {
    label: 'Gestionar mascotas',
    description: 'Consulta los pacientes registrados',
    icon: PawPrint,
    path: PATHS.PETS,
    permission: PERMISSIONS.PETS,
  },
  {
    label: 'Gestionar usuarios',
    description: 'Administra el acceso al sistema',
    icon: UsersRound,
    path: PATHS.USERS,
    permission: PERMISSIONS.USERS,
  },
  {
    label: 'Gestionar inventario',
    description: 'Consulta las existencias',
    icon: Package,
    path: PATHS.INVENTORY,
    permission: PERMISSIONS.INVENTORY,
  },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel =
    ROLE_LABELS[user.roleName] ?? user.roleName;

  const visibleStats = stats.filter((item) =>
    hasPermission(
      user.roleName,
      item.permission
    )
  );

  const visibleActions = quickActions.filter((item) =>
    hasPermission(
      user.roleName,
      item.permission
    )
  );

  const today = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
  }).format(new Date());

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>Dashboard</h1>

          <p>
            Resumen general de la clínica veterinaria.
          </p>
        </div>

        <span className={styles.date}>
          <CalendarDays size={17} />
          {today}
        </span>
      </header>

      <section className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <span>PORTAL DE GESTIÓN VETERINARIA</span>

          <h2>Bienvenido, {roleLabel}</h2>

          <p>
            Gestiona las operaciones de tu clínica
            desde un solo lugar.
          </p>
        </div>

        <PawPrint
          className={styles.welcomeIcon}
          size={120}
          strokeWidth={1.2}
          aria-hidden="true"
        />
      </section>

      {visibleStats.length > 0 && (
        <section
          className={styles.stats}
          aria-label="Indicadores generales"
        >
          {visibleStats.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              description={item.description}
              icon={item.icon}
              variant={item.variant}
            />
          ))}
        </section>
      )}

      {visibleActions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Accesos rápidos</h2>

            <p>
              Accede a las principales funciones
              del sistema.
            </p>
          </div>

          <div className={styles.actions}>
            {visibleActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={styles.action}
                >
                  <div className={styles.actionIcon}>
                    <Icon size={22} />
                  </div>

                  <div className={styles.actionContent}>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </div>

                  <ArrowUpRight
                    size={18}
                    className={styles.arrow}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}