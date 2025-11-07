import { useQuery } from "@tanstack/react-query";

import { type ApiError } from "@/shared/api/http-client";

import { queryKeys } from "@/core/query/keys";

import { wordSetsApi } from "../api/word-sets-api";
import type { WordSetDto } from "../types";

export function useWordSetListQuery() {
  return useQuery<WordSetDto[], ApiError>({
    queryKey: queryKeys.wordSets.all(),
    queryFn: wordSetsApi.list,
    staleTime: 1000 * 60 * 1,
  });
}
