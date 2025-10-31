import React, { useEffect } from 'react';
import styles from './CommonDialog.module.css';

interface CommonDialogProps {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

const CommonDialog: React.FC<CommonDialogProps> = ({ open, title, onClose, onConfirm, confirmText = 'OK', cancelText = 'Cancel', children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden />
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button onClick={onClose}>{cancelText}</button>
          {onConfirm && <button onClick={onConfirm}>{confirmText}</button>}
        </div>
      </div>
    </>
  );
};

export default CommonDialog;
