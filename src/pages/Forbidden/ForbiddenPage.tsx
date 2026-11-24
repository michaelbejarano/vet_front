import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PATHS } from '@/routes/paths';

import styles from './ForbiddenPage.module.css';

export default function ForbiddenPage() {
  return (
    <section className={styles.page}>
      <ShieldAlert size={56} />

      <h1>Acceso denegado</h1>

      <p>
        No tienes permisos para acceder
        a este módulo.
      </p>

      <Link
        to={PATHS.DASHBOARD}
        className={styles.link}
      >
        Volver al dashboard
      </Link>
    </section>
  );
}