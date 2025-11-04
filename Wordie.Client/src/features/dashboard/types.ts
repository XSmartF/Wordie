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
