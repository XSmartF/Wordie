import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...rest }) => {
  return (
    <div className={[styles.root, className].join(' ')}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} {...rest} />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default Input;
