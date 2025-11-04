import { httpClient } from "@/shared/api/http-client";
import type { PagedRequest, PagedResponse } from "@/shared/types/pagination";
import type { WordDto } from "@/features/words/types";
import type {
  WordSetDto,
  CreateWordSetRequest,
  UpdateWordSetRequest,
  BulkCreateWordInput,
  GeminiWordsRequest,
} from "../types";

const mapPayload = (payload: CreateWordSetRequest | UpdateWordSetRequest) => ({
  Title: payload.title,
  Description: payload.description,
  IsFavorite: payload.isFavorite ?? false,
});

export const wordSetsApi = {
  query: async (request: PagedRequest): Promise<PagedResponse<WordSetDto>> => {
    const response = await httpClient.post("/wordsets/query", request, {
      skipErrorToast: true,
    });
    return response.data as PagedResponse<WordSetDto>;
  },

  get: async (id: string): Promise<WordSetDto> => {
    const response = await httpClient.get(`/wordsets/${id}`);
    return response.data as WordSetDto;
  },

  create: async (data: CreateWordSetRequest): Promise<WordSetDto> => {
    const response = await httpClient.post("/wordsets", mapPayload(data));
    return response.data as WordSetDto;
  },

  update: async (
    id: string,
    data: UpdateWordSetRequest
  ): Promise<void> => {
    await httpClient.put(`/wordsets/${id}`, mapPayload(data));
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/wordsets/${id}`);
  },

  getWords: async (id: string, request: PagedRequest): Promise<PagedResponse<WordDto>> => {
    const response = await httpClient.post(`/wordsets/${id}/words/query`, request);
    return response.data as PagedResponse<WordDto>;
  },

  createWord: async (
    id: string,
    data: { term: string; definition: string; level: number }
  ): Promise<WordDto> => {
    const response = await httpClient.post(`/wordsets/${id}/words`, data);
    return response.data as WordDto;
  },

  createWordsBulk: async (id: string, words: BulkCreateWordInput[]): Promise<WordDto[]> => {
    const response = await httpClient.post(`/wordsets/${id}/words/bulk`, {
      words: words.map((word) => ({
        term: word.term,
        definition: word.definition,
        level: word.level,
      })),
    });

    return response.data as WordDto[];
  },

  createWordsWithGemini: async (id: string, payload: GeminiWordsRequest): Promise<WordDto[]> => {
    const response = await httpClient.post(`/wordsets/${id}/words/gemini`, payload);
    return response.data as WordDto[];
  },

  updateFavorite: async (id: string, isFavorite: boolean): Promise<WordSetDto> => {
    const response = await httpClient.patch(`/wordsets/${id}/favorite`, { IsFavorite: isFavorite });
    return response.data as WordSetDto;
  },

  getFavorites: async (): Promise<WordSetDto[]> => {
    const response = await httpClient.get("/wordsets/favorites");
    return response.data as WordSetDto[];
  },
};
