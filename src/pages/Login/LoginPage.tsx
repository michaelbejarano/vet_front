import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import AuthLayout from '@/components/layout/AuthLayout';
import LoginForm from './components/LoginForm';

//rutas centralizada
import { PATHS } from '@/routes/paths';

import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate(PATHS.DASHBOARD, {
  replace: true,
});
  }

  return (
    <AuthLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>
            PORTAL DE GESTIÓN
          </div>

          <h1>Bienvenido a VetCare</h1>

          <p>
            Ingresa tus credenciales para
            acceder al sistema.
          </p>
        </header>

        <LoginForm onSuccess={handleSuccess} />

        <div className={styles.security}>
          <ShieldCheck size={16} />

          <span>
            Acceso exclusivo para personal autorizado.
          </span>
        </div>
      </div>
    </AuthLayout>
  );
}