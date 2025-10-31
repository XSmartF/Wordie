import React, { useState, useEffect } from 'react';
import Table from './Table';
import { wordsApi } from './api';
import type { WordDto, PagedRequest, PagedResponse, FilterRule, SortRule, SearchRule, SortDirection } from './types';

const WordsTable: React.FC = () => {
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
      key: 'term' as keyof WordDto,
      header: 'Term',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
    {
      key: 'definition' as keyof WordDto,
      header: 'Definition',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
    {
      key: 'level' as keyof WordDto,
      header: 'Level',
      filterable: true,
      filterType: 'Number' as const
    },
    {
      key: 'wordSetId' as keyof WordDto,
      header: 'Word Set ID',
      filterable: true,
      filterType: 'Text' as const
    },
  ];

  const fetchWords = async (
    page: number = 1,
    pageSize: number = 20,
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
      <h2>Words</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => {
            fetchWords(1, data.PageSize, [], []);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Filters & Sort
        </button>
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

export default WordsTable;