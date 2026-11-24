import { Outlet } from 'react-router-dom';

import { SidebarProvider } from '@/context/SidebarContext';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

import styles from './DashboardLayout.module.css';

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className={styles.layout}>
        <Sidebar />

        <div className={styles.main}>
          <Header />

          <main className={styles.content}>
            <div className={styles.container}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}