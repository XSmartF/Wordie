import React, { useState, useEffect } from 'react';
import Table from './Table';
import { wordSetsApi } from './api';
import type { WordSetDto, PagedRequest, PagedResponse, FilterRule, SortRule, SearchRule, SortDirection } from './types';

const WordSetsTable: React.FC<{ onRowClick?: (wordSet: WordSetDto) => void }> = ({ onRowClick }) => {
  const [data, setData] = useState<PagedResponse<WordSetDto>>({
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
      key: 'title' as keyof WordSetDto,
      header: 'Title',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
    {
      key: 'description' as keyof WordSetDto,
      header: 'Description',
      filterable: true,
      searchable: true,
      filterType: 'Text' as const
    },
  ];

  const fetchWordSets = async (
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
      const response = await wordSetsApi.query(request);
      setData(response);
    } catch (error) {
      console.error('Error fetching word sets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordSets();
  }, []);

  const handlePageChange = (page: number) => {
    fetchWordSets(page, data.pageSize);
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
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => {
            fetchWordSets(1, data.PageSize, [], []);
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
        onRowClick={onRowClick}
      />
    </div>
  );
};

export default WordSetsTable;