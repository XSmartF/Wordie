import React from 'react';
import styles from './Select.module.css';

type Opt = { value: string | number; label: string };

interface SelectProps {
  options: Opt[];
  value?: string | number | (string | number)[];
  onChange: (v: string | number | (string | number)[]) => void;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ options, value, onChange, placeholder = '', multiple = false, className = '' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const vals = Array.from(e.target.selectedOptions).map(o => {
        const v = o.value;
        const opt = options.find(o2 => String(o2.value) === v);
        return opt && typeof opt.value === 'number' ? opt.value : v;
      });
      onChange(vals);
    } else {
      const v = e.target.value;
      const opt = options.find(o2 => String(o2.value) === v);
      onChange(opt && typeof opt.value === 'number' ? opt.value : v);
    }
  };

  return (
    <select className={[styles.select, className].join(' ')} value={Array.isArray(value) ? (value as (string|number)[]).map(String) : value !== undefined ? String(value) : ''} onChange={handleChange} multiple={multiple}>
      {!multiple && placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
      ))}
    </select>
  );
};

export default Select;
