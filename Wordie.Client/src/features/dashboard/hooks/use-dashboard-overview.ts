import { useQuery } from "@tanstack/react-query";

import { type ApiError } from "@/shared/api/http-client";

import { dashboardApi } from "../api/dashboard-api";
import type {
  DashboardSummary,
  DashboardTrendPoint,
  DashboardWordSetSummary,
} from "../types";

type DashboardOverview = {
  summary: DashboardSummary;
  trends: DashboardTrendPoint[];
  wordSets: DashboardWordSetSummary[];
};

async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const [summary, trends, wordSets] = await Promise.all([
    dashboardApi.summary(),
    dashboardApi.trends({ days: 120 }),
    dashboardApi.topWordSets({ take: 20 }),
  ]);

  return { summary, trends, wordSets };
}

export function useDashboardOverviewQuery() {
  return useQuery<DashboardOverview, ApiError>({
    queryKey: ["dashboard", "overview"],
    queryFn: fetchDashboardOverview,
    staleTime: 1000 * 60 * 5,
  });
}
