import type { GeminiPreviewWord, WordWithProgress } from "@/core/word-sets/types";
import { wordSetsService } from "@/core/word-sets/service";
import type {
  BulkCreateWordInput,
  CreateWordSetRequest,
  GeminiWordsRequest,
  UpdateWordSetRequest,
  WordSetDto,
} from "../types";
import type { PagedRequest, PagedResponse } from "@/shared/types/pagination";

export const wordSetsApi = {
  query: (request: PagedRequest): Promise<PagedResponse<WordSetDto>> => {
    return wordSetsService.query(request);
  },

  list: (): Promise<WordSetDto[]> => {
    return wordSetsService.list();
  },

  get: (id: string): Promise<WordSetDto> => {
    return wordSetsService.get(id);
  },

  create: (data: CreateWordSetRequest): Promise<WordSetDto> => {
    return wordSetsService.create(data);
  },

  update: (id: string, data: UpdateWordSetRequest): Promise<void> => {
    return wordSetsService.update(id, data);
  },

  delete: (id: string): Promise<void> => {
    return wordSetsService.delete(id);
  },

  getWords: (id: string, request: PagedRequest): Promise<PagedResponse<WordWithProgress>> => {
    return wordSetsService.getWords(id, request);
  },

  createWord: (
    id: string,
    data: { term: string; definition: string; level: number }
  ): Promise<WordWithProgress> => {
    return wordSetsService.createWord(id, data);
  },

  createWordsBulk: (id: string, words: BulkCreateWordInput[]): Promise<WordWithProgress[]> => {
    return wordSetsService.createWordsBulk(id, words);
  },

  generateWordsWithGemini: (
    payload: GeminiWordsRequest,
  ): Promise<GeminiPreviewWord[]> => {
    return wordSetsService.generateWordsWithGemini(payload);
  },

  updateFavorite: (id: string, isFavorite: boolean): Promise<WordSetDto> => {
    return wordSetsService.updateFavorite(id, isFavorite);
  },

  getFavorites: (): Promise<WordSetDto[]> => {
    return wordSetsService.getFavorites();
  },
};
