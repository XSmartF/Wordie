import React, { useState, useEffect, useCallback } from 'react';
import Table from './Table';
import { wordSetsApi, wordsApi } from './api';
import { CommonDialog, Input } from './components';
import type { WordDto, PagedRequest, PagedResponse, FilterRule, SortRule, SearchRule, SortDirection } from './types';

interface WordSetDetailProps {
  wordSetId: string;
  wordSetTitle: string;
  onBack: () => void;
}

const WordSetDetail: React.FC<WordSetDetailProps> = ({ wordSetId, wordSetTitle, onBack }) => {
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create'|'edit'|'delete'>('create');
  const [active, setActive] = useState<WordDto | null>(null);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [level, setLevel] = useState<number | undefined>(undefined);
  const [toDelete, setToDelete] = useState<WordDto[]>([]);

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
      filterType: 'MultiSelect' as const,
      options: [
        { value: 1, label: 'Beginner' },
        { value: 2, label: 'Intermediate' },
        { value: 3, label: 'Advanced' },
      ]
    },
    // (Removed created date demo column to avoid incorrect filtering on Id)
  ];

  const fetchWords = useCallback(async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterRule[] = [],
    sorts: { Field: string; Direction: SortDirection }[] = [],
    search?: SearchRule
  ) => {
    setLoading(true);
    try {
      // Add filter for wordSetId
      const wordSetFilter: FilterRule = {
        Field: 'WordSetId',
        Type: 'Text',
        Operator: 'Equal',
        Value: wordSetId
      };
      const allFilters = [wordSetFilter, ...filters];

      const request: PagedRequest = {
        Page: page,
        PageSize: pageSize,
        Filters: allFilters.length > 0 ? allFilters : undefined,
        Sorts: sorts.length > 0 ? sorts.map(s => ({ Field: s.Field, Direction: s.Direction } as SortRule)) : undefined,
        Search: search,
      };
  const response = await wordSetsApi.getWords(wordSetId, request);
      setData(response);
    } catch (error) {
      console.error('Error fetching words for wordset:', error);
    } finally {
      setLoading(false);
    }
  }, [wordSetId]);

  useEffect(() => {
    fetchWords();
  }, [wordSetId, fetchWords]);

  const openCreate = () => { setDialogMode('create'); setActive(null); setTerm(''); setDefinition(''); setLevel(undefined); setDialogOpen(true); };
  const openEdit = (items: WordDto[]) => { setDialogMode('edit'); const w = items.length > 0 ? items[0] : null; setActive(w); setTerm(w?.Term || ''); setDefinition(w?.Definition || ''); setLevel(w?.Level); setDialogOpen(true); };
  const openDelete = (items: WordDto[]) => { setDialogMode('delete'); setToDelete(items); setActive(items.length > 0 ? items[0] : null); setDialogOpen(true); };

  const handleConfirm = async () => {
    try {
      if (dialogMode === 'create') {
        await wordSetsApi.createWord(wordSetId, { term, definition, level: level ?? 0 });
      } else if (dialogMode === 'edit' && active) {
        // update via wordsApi
        if (active.Id) await wordsApi.update(active.Id, { term, definition, level: level ?? 0, wordSetId });
      } else if (dialogMode === 'delete') {
        for (const it of toDelete) {
          if (it.Id) await wordsApi.delete(it.Id);
        }
      }
      await fetchWords(1, data.PageSize);
    } catch (err) {
      console.error('Error handling word dialog action:', err);
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
  <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          ← Back to Word Sets
        </button>
        {/* New/Edit/Delete actions are exposed via the Table toolbar buttons as well */}
        <h2>Words in "{wordSetTitle}"</h2>
      </div>
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
          { key: 'edit', label: 'Edit', onClick: (sel) => sel.length === 1 && openEdit(sel), variant: 'secondary', disabled: (sel) => sel.length !== 1 },
          { key: 'delete', label: 'Delete', onClick: (sel) => sel.length > 0 && openDelete(sel), variant: 'danger', disabled: (sel) => sel.length === 0 },
        ]}
      />
      <CommonDialog open={dialogOpen} title={`Create word in "${wordSetTitle}"`} onClose={() => setDialogOpen(false)} onConfirm={handleConfirm} confirmText="Create">
        <div style={{ display: 'grid', gap: 8 }}>
          <label>Term</label>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} />
          <label>Definition</label>
          <Input value={definition} onChange={(e) => setDefinition(e.target.value)} />
          <label>Level</label>
          <Input value={level?.toString() || ''} onChange={(e) => setLevel(Number(e.target.value))} />
        </div>
      </CommonDialog>
    </div>
  );
};

export default WordSetDetail;