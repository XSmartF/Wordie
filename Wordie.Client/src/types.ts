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
  Id: string;
  Term: string;
  Definition: string;
  Level: number;
  WordSetId?: string;
  CreatedAt: string;
}

export interface WordSetDto {
  Id: string;
  Title: string;
  Description?: string;
  CreatedAt: string;
  IsFavorite: boolean;
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

export interface DashboardSummaryResponse {
  TotalWords: number;
  WordsAddedLast30Days: number;
  WordsMonthlyChangePercent: number;
  TotalWordSets: number;
  WordSetsCreatedLast30Days: number;
  WordSetsMonthlyChangePercent: number;
  ActiveWordSetsLast30Days: number;
  ActiveWordSetsChangePercent: number;
  AverageWordsPerSet: number;
}

export interface DashboardTrendPointResponse {
  Date: string;
  Words: number;
  WordSets: number;
}

export interface DashboardWordSetSummaryResponse {
  Id: string;
  Title: string;
  Description?: string;
  CreatedAt: string;
  WordCount: number;
  LastWordAddedAt?: string;
}

export interface DashboardSummary {
  totalWords: number;
  wordsAddedLast30Days: number;
  wordsMonthlyChangePercent: number;
  totalWordSets: number;
  wordSetsCreatedLast30Days: number;
  wordSetsMonthlyChangePercent: number;
  activeWordSetsLast30Days: number;
  activeWordSetsChangePercent: number;
  averageWordsPerSet: number;
}

export interface DashboardTrendPoint {
  date: string;
  words: number;
  wordSets: number;
}

export interface DashboardWordSetSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  wordCount: number;
  lastWordAddedAt?: string;
}