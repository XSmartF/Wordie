import React, { useState, useEffect, useCallback } from 'react';
import Table from './Table';
import { wordsApi } from './api';
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
    PageSize: 20,
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
  ];

  const fetchWords = useCallback(async (
    page: number = 1,
    pageSize: number = 20,
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
      const response = await wordsApi.query(request);
      setData(response);
    } catch (error) {
      console.error('Error fetching words for wordset:', error);
    } finally {
      setLoading(false);
    }
  }, [wordSetId]);

  useEffect(() => {
    fetchWords();
  }, [wordSetId]);

  const handlePageChange = (page: number) => {
    fetchWords(page, data.pageSize);
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
      />
    </div>
  );
};

export default WordSetDetail;