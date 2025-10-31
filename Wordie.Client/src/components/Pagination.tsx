import React from 'react';
import styles from './Pagination.module.css';
import Button from './Button';
import ComboBox from './ComboBox';

interface PaginationProps {
  Page: number;
  PageSize: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ Page, PageSize, TotalPages, HasNext, HasPrevious, onPageChange, onPageSizeChange }) => {
  const current = Page;
  const maxButtons = 7;
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  if (current + half > TotalPages) start = Math.max(1, TotalPages - maxButtons + 1);
  const end = Math.min(TotalPages, start + maxButtons - 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <label>Page size: </label>
        <ComboBox
          options={[{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
          value={String(PageSize)}
          onSelect={(opt) => onPageSizeChange(Number(opt.value))}
          onChange={(v) => onPageSizeChange(Number(v))}
        />
      </div>
      <div className={styles.center}>
        <Button variant="ghost" onClick={() => onPageChange(current - 1)} disabled={!HasPrevious}>Previous</Button>
        {start > 1 && <Button variant="ghost" onClick={() => onPageChange(1)}>1</Button>}
        {start > 2 && <span className={styles.ellipsis}>...</span>}
        {pages.map(p => (
          <Button key={p} variant={p === current ? 'primary' : 'secondary'} onClick={() => onPageChange(p)} disabled={p === current}>{p}</Button>
        ))}
        {end < TotalPages - 1 && <span className={styles.ellipsis}>...</span>}
        {end < TotalPages && <Button variant="ghost" onClick={() => onPageChange(TotalPages)}>{TotalPages}</Button>}
        <Button variant="ghost" onClick={() => onPageChange(current + 1)} disabled={!HasNext}>Next</Button>
      </div>
    </div>
  );
};

export default Pagination;
