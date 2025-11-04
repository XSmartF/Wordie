export interface WordDto {
  Id: string;
  Term: string;
  Definition: string;
  Level: number;
  WordSetId?: string;
  CreatedAt: string;
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
