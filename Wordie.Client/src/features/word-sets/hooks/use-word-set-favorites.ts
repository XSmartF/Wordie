import { useQuery } from "@tanstack/react-query";

import { type ApiError } from "@/shared/api/http-client";

import { wordSetsApi } from "../api/word-sets-api";
import type { WordSetDto } from "../types";

export function useWordSetFavoritesQuery() {
  return useQuery<WordSetDto[], ApiError>({
    queryKey: ["wordSets", "favorites"],
    queryFn: wordSetsApi.getFavorites,
    staleTime: 1000 * 60 * 5,
  });
}
