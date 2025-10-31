import React, { useState, useEffect } from 'react';
import Table from './Table';
import { CommonDialog, Input } from './components';
import { wordSetsApi } from './api';
import type { WordSetDto, PagedRequest, PagedResponse, FilterRule, SortRule, SearchRule, SortDirection } from './types';

const WordSetsTable: React.FC<{ onRowClick?: (wordSet: WordSetDto) => void }> = ({ onRowClick }) => {
  const [data, setData] = useState<PagedResponse<WordSetDto>>({
    Items: [],
    TotalCount: 0,
    Page: 1,
    PageSize: 10,
    TotalPages: 0,
    HasNext: false,
    HasPrevious: false,
  });
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: 'Title' as keyof WordSetDto,
      header: 'Title',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
    {
      key: 'Description' as keyof WordSetDto,
      header: 'Description',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
  ];

  const fetchWordSets = async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterRule[] = [],
    sorts: { Field: string; Direction: SortDirection }[] = [],
    search?: SearchRule
  ) => {
    setLoading(true);
    try {
      const request: PagedRequest = {
        Page: page,
        PageSize: pageSize,
        Filters: filters.length > 0 ? filters : undefined,
        Sorts: sorts.length > 0 ? sorts.map(s => ({ Field: s.Field, Direction: s.Direction } as SortRule)) : undefined,
        Search: search,
      };
      const response = await wordSetsApi.query(request);
      setData(response);
    } catch (error) {
      console.error('Error fetching word sets:', error);
    } finally {
      setLoading(false);
    }
  };

  // dialog state for create/edit/delete
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create'|'edit'|'delete'>('create');
  const [active, setActive] = useState<WordSetDto | null>(null);
  const [titleVal, setTitleVal] = useState('');
  const [descVal, setDescVal] = useState('');
  // selection is handled by Table and passed to button callbacks; no local selectedItems needed
  const [toDelete, setToDelete] = useState<WordSetDto[]>([]);

  const openCreate = () => { setDialogMode('create'); setActive(null); setTitleVal(''); setDescVal(''); setDialogOpen(true); };
  const openEdit = (ws: WordSetDto) => { setDialogMode('edit'); setActive(ws); setTitleVal(ws.Title || ''); setDescVal(ws.Description || ''); setDialogOpen(true); };
  const openDelete = (items: WordSetDto[]) => { setDialogMode('delete'); setToDelete(items); setActive(items.length > 0 ? items[0] : null); setDialogOpen(true); };

  const handleConfirm = async () => {
    if (dialogMode === 'create') {
      await wordSetsApi.create({ title: titleVal, description: descVal });
      await fetchWordSets(1, data.PageSize);
    } else if (dialogMode === 'edit' && active) {
      await wordSetsApi.update(active.Id!, { title: titleVal, description: descVal });
      await fetchWordSets(1, data.PageSize);
    } else if (dialogMode === 'delete') {
      for (const it of toDelete) {
        if (it.Id) await wordSetsApi.delete(it.Id);
      }
      await fetchWordSets(1, data.PageSize);
    }
    setDialogOpen(false);
  };

  useEffect(() => {
    fetchWordSets();
  }, []);

  const handlePageChange = (page: number) => {
    fetchWordSets(page, data.PageSize);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchWordSets(1, pageSize);
  };

  const handleFiltersChange = (filters: FilterRule[]) => {
    fetchWordSets(1, data.PageSize, filters);
  };

  const handleSortChange = (sorts: { Field: string; Direction: SortDirection }[]) => {
    fetchWordSets(1, data.PageSize, [], sorts);
  };

  const handleSearchChange = (search: SearchRule | undefined) => {
    fetchWordSets(1, data.PageSize, [], [], search);
  };

  return (
    <div>
      <h2>Word Sets</h2>
      <Table
        data={data}
        columns={columns}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onRowClick={onRowClick}
  selectable={true}
        buttons={[
          { key: 'clear', label: 'Clear Filters & Sort', onClick: () => fetchWordSets(1, data.PageSize, [], []), variant: 'primary' },
          { key: 'new', label: 'New Word Set', onClick: () => openCreate(), variant: 'primary' },
          { key: 'edit', label: 'Edit', onClick: (sel) => sel.length === 1 && openEdit(sel[0]), variant: 'secondary', disabled: (sel) => sel.length !== 1 },
          { key: 'delete', label: 'Delete', onClick: (sel) => sel.length > 0 && openDelete(sel), variant: 'danger', disabled: (sel) => sel.length === 0 },
        ]}
      />
      
      <CommonDialog open={dialogOpen} title={dialogMode === 'create' ? 'Create Word Set' : dialogMode === 'edit' ? 'Edit Word Set' : 'Delete Word Set'} onClose={() => setDialogOpen(false)} onConfirm={handleConfirm} confirmText={dialogMode === 'delete' ? 'Delete' : 'Save'}>
        {dialogMode === 'delete' ? (
          <div>Are you sure you want to delete <strong>{active?.Title}</strong>?</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            <label>Title</label>
            <Input value={titleVal} onChange={(e) => setTitleVal(e.target.value)} />
            <label>Description</label>
            <Input value={descVal} onChange={(e) => setDescVal(e.target.value)} />
          </div>
        )}
      </CommonDialog>
    </div>
  );
};

export default WordSetsTable;