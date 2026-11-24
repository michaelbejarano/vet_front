import { Construction } from 'lucide-react';

import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({
  title,
}: PlaceholderPageProps) {
  return (
    <div className={styles.page}>
      <h1>{title}</h1>

      <section className={styles.content}>
        <div className={styles.icon}>
          <Construction size={32} />
        </div>

        <h2>Módulo en desarrollo</h2>

        <p>
          Aquí se implementarán las funcionalidades
          de {title.toLowerCase()}.
        </p>
      </section>
    </div>
  );
}