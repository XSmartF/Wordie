export type FilterType =
  | "Text"
  | "Number"
  | "Date"
  | "Enum"
  | "MultiSelect"
  | "Range"
  | "DateRange";

export type FilterOperator =
  | "Equal"
  | "NotEqual"
  | "GreaterThan"
  | "GreaterThanOrEqual"
  | "LessThan"
  | "LessThanOrEqual"
  | "Contains"
  | "NotContains"
  | "Include"
  | "Exclude"
  | "Between";

export type SortDirection = "Asc" | "Desc";

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
