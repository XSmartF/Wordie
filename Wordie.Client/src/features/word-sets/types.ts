export interface WordSetDto {
  Id: string;
  Title: string;
  Description?: string;
  CreatedAt: string;
  IsFavorite: boolean;
}

export interface CreateWordSetRequest {
  title: string;
  description?: string;
  isFavorite?: boolean;
}

export interface UpdateWordSetRequest {
  title: string;
  description?: string;
  isFavorite?: boolean;
}

export interface BulkCreateWordInput {
  term: string;
  definition: string;
  level: number;
}

export interface GeminiWordsRequest {
  prompt: string;
  defaultLevel?: number;
  maxWords?: number;
}
