import {
  useEffect,
  useId,
  useRef,
} from 'react';

import type { ReactNode } from 'react';

import { X } from 'lucide-react';

import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  busy = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby={titleId}
      aria-describedby={
        description ? descriptionId : undefined
      }
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) onClose();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>{title}</h2>

          {description && (
            <p id={descriptionId}>
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar ventana"
        >
          <X size={22} />
        </button>
      </header>

      <div className={styles.content}>
        {children}
      </div>
    </dialog>
  );
}