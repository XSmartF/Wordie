import React, { useState, useEffect } from 'react';
import Table from './Table';
import { CommonDialog, Input } from './components';
import { wordsApi } from './api';
import type { WordDto, PagedRequest, PagedResponse, FilterRule, SortRule, SearchRule, SortDirection } from './types';

const WordsTable: React.FC = () => {
  const [data, setData] = useState<PagedResponse<WordDto>>({
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
      key: 'Term' as keyof WordDto,
      header: 'Term',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
    {
      key: 'Definition' as keyof WordDto,
      header: 'Definition',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
    {
      key: 'Level' as keyof WordDto,
      header: 'Level',
      filterable: true,
      filterType: 'Number' as const
    },
    {
      key: 'WordSetId' as keyof WordDto,
      header: 'Word Set ID',
      filterable: true,
      filterType: 'Text' as const
    },
  ];

  const fetchWords = async (
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
      const response = await wordsApi.query(request);
      setData(response);
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create'|'edit'|'delete'>('create');
  const [active, setActive] = useState<WordDto | null>(null);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [level, setLevel] = useState<number | undefined>(undefined);
  // selection handled by Table buttons; no local selectedItems needed
  const [toDelete, setToDelete] = useState<WordDto[]>([]);

  const openCreate = () => { setDialogMode('create'); setActive(null); setTerm(''); setDefinition(''); setLevel(undefined); setDialogOpen(true); };
  const openEdit = (w: WordDto) => { setDialogMode('edit'); setActive(w); setTerm(w.Term || ''); setDefinition(w.Definition || ''); setLevel(w.Level); setDialogOpen(true); };
  const openDelete = (items: WordDto[]) => { setDialogMode('delete'); setToDelete(items); setActive(items.length > 0 ? items[0] : null); setDialogOpen(true); };

  const handleConfirm = async () => {
    try {
      if (dialogMode === 'create') {
        await wordsApi.create({ term, definition, level: level ?? 0, wordSetId: active?.WordSetId });
      } else if (dialogMode === 'edit' && active) {
        await wordsApi.update(active.Id!, { term, definition, level: level ?? 0, wordSetId: active.WordSetId });
      } else if (dialogMode === 'delete') {
        for (const it of toDelete) {
          if (it.Id) await wordsApi.delete(it.Id);
        }
      }
      await fetchWords(1, data.PageSize);
    } catch (err) {
      console.error(err);
    } finally {
      setDialogOpen(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchWords(page, data.PageSize);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchWords(1, pageSize);
  };

  const handleFiltersChange = (filters: FilterRule[]) => {
    fetchWords(1, data.PageSize, filters);
  };

  const handleSortChange = (sorts: { Field: string; Direction: SortDirection }[]) => {
    fetchWords(1, data.PageSize, [], sorts);
  };

  const handleSearchChange = (search: SearchRule | undefined) => {
    fetchWords(1, data.PageSize, [], [], search);
  };

  return (
    <div>
      <h2>Words</h2>
      <Table
        data={data}
        columns={columns}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        selectable={true}
        buttons={[
          { key: 'clear', label: 'Clear Filters & Sort', onClick: () => fetchWords(1, data.PageSize, [], []), variant: 'primary' },
          { key: 'new', label: 'New Word', onClick: () => openCreate(), variant: 'primary' },
          { key: 'edit', label: 'Edit', onClick: (sel) => sel.length === 1 && openEdit(sel[0]), variant: 'secondary', disabled: (sel) => sel.length !== 1 },
          { key: 'delete', label: 'Delete', onClick: (sel) => sel.length > 0 && openDelete(sel), variant: 'danger', disabled: (sel) => sel.length === 0 },
        ]}
      />

      <CommonDialog open={dialogOpen} title={dialogMode === 'create' ? 'Create Word' : dialogMode === 'edit' ? 'Edit Word' : 'Delete Word'} onClose={() => setDialogOpen(false)} onConfirm={handleConfirm} confirmText={dialogMode === 'delete' ? 'Delete' : 'Save'}>
        {dialogMode === 'delete' ? (
          <div>Are you sure you want to delete <strong>{active?.Term}</strong>?</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            <label>Term</label>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} />
            <label>Definition</label>
            <Input value={definition} onChange={(e) => setDefinition(e.target.value)} />
            <label>Level</label>
            <Input value={level?.toString() || ''} onChange={(e) => setLevel(Number(e.target.value))} />
          </div>
        )}
      </CommonDialog>
    </div>
  );
};

export default WordsTable;