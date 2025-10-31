import React, { useEffect, useRef, useState } from 'react';
import styles from './ComboBox.module.css';

type Opt = { value: string | number; label: string };

interface ComboBoxProps {
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: Opt) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  showAllOnOpen?: boolean;
  showSearchInside?: boolean;
}

const ComboBox: React.FC<ComboBoxProps> = ({ options, value, onChange, onSelect, placeholder = '', className = '', editable = false, showAllOnOpen = true, showSearchInside = false }) => {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false);
  const [innerSearch, setInnerSearch] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Determine the selected label to display when not editable
  const selectedLabel = (() => {
    const found = options.find(o => String(o.value) === String(value));
    return found ? found.label : value;
  })();

  const filtered = (() => {
    const showAll = showAllOnOpen && !typed && open && !innerSearch;
    if (showAll) return options;
    const q = (innerSearch || value || '').toString().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toString().toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q));
  })();
  

  return (
    <div ref={ref} className={[styles.root, className].join(' ')}>
      {editable ? (
        <input
          className={styles.input}
          value={value}
          onChange={(e) => { setTyped(true); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
        />
      ) : (
        <button
          type="button"
          className={styles.input}
          onClick={() => { setOpen(s => !s); setTyped(false); setInnerSearch(''); }}
        >
          {selectedLabel || placeholder}
        </button>
      )}

      {open && (
        <div className={styles.dropdown} role="listbox">
          {showSearchInside && (
            <div className={styles.innerSearchWrapper}>
              <input
                className={styles.innerSearch}
                value={innerSearch}
                onChange={(e) => { setInnerSearch(e.target.value); }}
                placeholder="Search..."
                autoFocus
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className={styles.empty}>No options</div>
          ) : (
            filtered.map(opt => (
              <div
                key={String(opt.value)}
                className={styles.item}
                role="option"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(opt);
                  // keep backward compatibility: also call onChange with stringified value
                  onChange(String(opt.value));
                  setOpen(false);
                  setTyped(false);
                  setInnerSearch('');
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ComboBox;
