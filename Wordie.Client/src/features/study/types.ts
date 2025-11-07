export const STUDY_MODE = {
  Flashcard: 1,
  MultipleChoice: 2,
  Typing: 3,
} as const;

export type StudyMode = (typeof STUDY_MODE)[keyof typeof STUDY_MODE];

export const STUDY_CARD_DIRECTION = {
  TermToDefinition: 1,
  DefinitionToTerm: 2,
  Mixed: 3,
} as const;

export type StudyCardDirection =
  (typeof STUDY_CARD_DIRECTION)[keyof typeof STUDY_CARD_DIRECTION];

export const STUDY_CARD_STATUS = {
  New: 1,
  Learning: 2,
  Review: 3,
  Relearning: 4,
} as const;

export type StudyCardStatus =
  (typeof STUDY_CARD_STATUS)[keyof typeof STUDY_CARD_STATUS];

export const STUDY_RATING = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const;

export type StudyRating = (typeof STUDY_RATING)[keyof typeof STUDY_RATING];

export const STUDY_SESSION_STATUS = {
  Active: 1,
  Completed: 2,
  Cancelled: 3,
} as const;

export type StudySessionStatus =
  (typeof STUDY_SESSION_STATUS)[keyof typeof STUDY_SESSION_STATUS];

export interface StudySettingsDto {
  Mode: StudyMode;
  Direction: StudyCardDirection;
  Limit: number;
  IncludeDue: boolean;
  IncludeNew: boolean;
  Shuffle: boolean;
  AllowFlip: boolean;
  AllowTyping: boolean;
}

export interface StudyCardDto {
  ProgressId: string;
  WordId: string;
  Prompt: string;
  ExpectedAnswer: string;
  Options?: string[] | null;
  Status: StudyCardStatus;
  LastRating?: StudyRating | null;
  Attempts: number;
  IsCorrect: boolean;
  ConsecutiveCorrect: number;
  TimeSpentSeconds: number;
  OrderIndex: number;
  Accuracy: number;
  Direction: StudyCardDirection;
}

export interface StudySessionStatsDto {
  TotalCards: number;
  CompletedCards: number;
  CorrectAnswers: number;
  IncorrectAnswers: number;
  TotalTime: string; // ISO duration serialized from TimeSpan
}

export interface StudySessionDto {
  Id: string;
  WordSetId: string;
  Status: StudySessionStatus;
  StartedAt: string;
  CompletedAt?: string | null;
  Settings: StudySettingsDto;
  Stats: StudySessionStatsDto;
  Queue: StudyCardDto[];
  CurrentCard?: StudyCardDto | null;
}

export interface StartStudySessionRequest {
  WordSetId: string;
  Mode: StudyMode;
  Direction: StudyCardDirection;
  Limit?: number | null;
  IncludeDue?: boolean;
  IncludeNew?: boolean;
  Shuffle?: boolean;
  AllowFlip?: boolean;
  AllowTyping?: boolean;
}

export interface SubmitStudyAnswerRequest {
  ProgressId: string;
  Rating: StudyRating;
  TimeSpentSeconds: number;
  UserAnswer?: string | null;
  SelectedOptions?: string[] | null;
}

export interface StudyAnswerResponse {
  Session: StudySessionDto;
  NextCard?: StudyCardDto | null;
}
