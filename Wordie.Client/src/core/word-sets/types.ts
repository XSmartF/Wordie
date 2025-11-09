export interface WordSet {
  Id: string
  Title: string
  Description?: string
  CreatedAt: string
  IsFavorite: boolean
}

export interface WordWithProgress {
  Id: string
  WordSetId?: string
  Term: string
  Definition: string
  DefinitionVietnamese?: string | null
  Example?: string | null
  TypeOfWord?: string | null
  Note?: string | null
  Level: number
  CreatedAt: string
  EaseFactor?: number
  Interval?: number
  Repetition?: number
  LastReviewedAt?: string | null
  DueAt?: string | null
  CorrectCount?: number
  IncorrectCount?: number
  Lapses?: number
  ConsecutiveCorrect?: number
  LastRating?: number | null
  LastSessionAt?: string | null
}

export interface CreateWordSetPayload {
  title: string
  description?: string
  isFavorite?: boolean
}

export interface UpdateWordSetPayload {
  title: string
  description?: string
  isFavorite?: boolean
}

export interface BulkCreateWordPayload {
  term: string
  definition: string
  definitionVietnamese?: string | null
  example?: string | null
  typeOfWord?: string | null
  note?: string | null
  level: number
}

export interface GeminiWordsPayload {
  prompt: string
  defaultLevel?: number
  maxWords?: number
}

export interface GeminiPreviewWord {
  Term: string
  Definition: string
  DefinitionVietnamese?: string | null
  Example?: string | null
  TypeOfWord?: string | null
  Note?: string | null
  Level: number
}
