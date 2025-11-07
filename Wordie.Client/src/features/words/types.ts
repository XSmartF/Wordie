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
