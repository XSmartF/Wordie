export type FilterType = 'Text' | 'Number' | 'Date' | 'Enum' | 'MultiSelect' | 'Range';

export type FilterOperator = 'Equal' | 'NotEqual' | 'GreaterThan' | 'GreaterThanOrEqual' | 'LessThan' | 'LessThanOrEqual' | 'Contains' | 'NotContains' | 'Include' | 'Exclude' | 'Between';

export type SortDirection = 'Asc' | 'Desc';

export interface FilterRule {
  Field: string;
  Type: FilterType;
  Operator: FilterOperator;
  Value?: unknown;
}

export interface SortRule {
  Field: string;
  Direction: SortDirection;
}

export interface SearchRule {
  Columns: string[];
  Keyword: string;
}

export interface PagedRequest {
  Page: number;
  PageSize: number;
  Search?: SearchRule;
  Filters?: FilterRule[];
  Sorts?: SortRule[];
}

export interface PagedResponse<T> {
  Items: T[];
  TotalCount: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export interface WordDto {
  id: string;
  term: string;
  definition: string;
  level: number;
  wordSetId?: string;
  userId: string;
}

export interface WordSetDto {
  id: string;
  title: string;
  description?: string;
  userId: string;
}

export interface CreateWordRequest {
  term: string;
  definition: string;
  level: number;
  wordSetId?: string;
}

export interface UpdateWordRequest {
  term: string;
  definition: string;
  level: number;
  wordSetId?: string;
}

export interface CreateWordSetRequest {
  title: string;
  description?: string;
}

export interface UpdateWordSetRequest {
  title: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}