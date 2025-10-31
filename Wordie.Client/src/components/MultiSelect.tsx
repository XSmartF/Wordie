import React, { useEffect, useRef, useState } from 'react';
import styles from './MultiSelect.module.css';

type Opt = { value: string | number; label: string };

interface MultiSelectProps {
  options: Opt[];
  value: (string | number)[];
  onChange: (v: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder = 'Select...', disabled = false, className = '' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggleValue = (val: string | number) => {
    if (value.includes(val)) onChange(value.filter(v => v !== val));
    else onChange([...value, val]);
  };

  const clearAll = (e?: React.MouseEvent) => { e?.stopPropagation(); onChange([]); };

  return (
    <div ref={rootRef} className={[styles.root, className].join(' ')}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen(s => !s)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className={styles.valueArea}>
          {value.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            <div className={styles.chips}>
              {value.slice(0, 3).map(v => (
                <span key={String(v)} className={styles.chip}>{String(options.find(o => o.value === v)?.label ?? v)}</span>
              ))}
              {value.length > 3 && <span className={styles.more}>+{value.length - 3}</span>}
            </div>
          )}
        </div>
        <div className={styles.controls}>
          {value.length > 0 && (
            <span
              className={styles.clearBtn}
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); clearAll(); } }}
              aria-label="Clear selection"
            >
              ×
            </span>
          )}
          <span className={styles.caret}>▾</span>
        </div>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.options}>
            {options.map(opt => (
              <label key={String(opt.value)} className={styles.option}>
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                />
                <span className={styles.optLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
