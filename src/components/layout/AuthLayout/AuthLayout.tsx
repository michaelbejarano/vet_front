import type { ReactNode } from 'react';

import {
  PawPrint,
  CalendarDays,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';

import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className={styles.layout}>
      <aside className={styles.brandPanel}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <PawPrint size={28} />
          </div>

          <span>VetCare</span>
        </div>

        <div className={styles.presentation}>
          <div className={styles.illustration}>
            <PawPrint size={90} strokeWidth={1.3} />
          </div>

          <h1>
            Cuidamos a quienes
            <br />
            más importan.
          </h1>

          <p>
            Gestiona tu clínica veterinaria
            desde un solo lugar.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <CalendarDays size={20} />
              Gestión de citas y pacientes
            </div>

            <div className={styles.feature}>
              <HeartPulse size={20} />
              Atención e historial clínico
            </div>

            <div className={styles.feature}>
              <ShieldCheck size={20} />
              Gestión segura y centralizada
            </div>
          </div>
        </div>

        <footer className={styles.brandFooter}>
          Sistema de gestión integral veterinaria
        </footer>
      </aside>

      <section className={styles.content}>
        <div className={styles.mobileBrand}>
          <PawPrint size={30} />
          <span>VetCare</span>
        </div>

        <div className={styles.contentInner}>
          {children}
        </div>

        <footer className={styles.footer}>
          © {new Date().getFullYear()} VetCare.
          Todos los derechos reservados.
        </footer>
      </section>
    </main>
  );
}