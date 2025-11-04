import { httpClient } from "@/shared/api/http-client";
import type {
  DashboardSummary,
  DashboardSummaryResponse,
  DashboardTrendPoint,
  DashboardTrendPointResponse,
  DashboardWordSetSummary,
  DashboardWordSetSummaryResponse,
} from "../types";

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const { data } = await httpClient.get<DashboardSummaryResponse>(
      "/dashboard/summary",
    );

    return {
      totalWords: data.TotalWords,
      wordsAddedLast30Days: data.WordsAddedLast30Days,
      wordsMonthlyChangePercent: data.WordsMonthlyChangePercent,
      totalWordSets: data.TotalWordSets,
      wordSetsCreatedLast30Days: data.WordSetsCreatedLast30Days,
      wordSetsMonthlyChangePercent: data.WordSetsMonthlyChangePercent,
      activeWordSetsLast30Days: data.ActiveWordSetsLast30Days,
      activeWordSetsChangePercent: data.ActiveWordSetsChangePercent,
      averageWordsPerSet: data.AverageWordsPerSet,
    };
  },

  trends: async (params?: { days?: number }): Promise<DashboardTrendPoint[]> => {
    const { data } = await httpClient.get<DashboardTrendPointResponse[]>(
      "/dashboard/trends",
      { params },
    );

    return data.map((point) => ({
      date: point.Date,
      words: point.Words,
      wordSets: point.WordSets,
    }));
  },

  topWordSets: async (params?: { take?: number }): Promise<DashboardWordSetSummary[]> => {
    const { data } = await httpClient.get<DashboardWordSetSummaryResponse[]>(
      "/dashboard/top-wordsets",
      { params },
    );

    return data.map((set) => ({
      id: set.Id,
      title: set.Title,
      description: set.Description,
      createdAt: set.CreatedAt,
      wordCount: set.WordCount,
      lastWordAddedAt: set.LastWordAddedAt,
    }));
  },
};
