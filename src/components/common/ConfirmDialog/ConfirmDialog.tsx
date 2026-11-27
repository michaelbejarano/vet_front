import { AlertTriangle } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      busy={loading}
      onClose={onCancel}
    >
      <div className={styles.content}>
        <div className={styles.message}>
          <div
            className={
              variant === 'danger'
                ? styles.dangerIcon
                : styles.primaryIcon
            }
          >
            <AlertTriangle size={24} />
          </div>

          <p>{description}</p>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            variant={variant}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}