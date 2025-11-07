import { httpClient } from "@/shared/api/http-client"
import type { PagedRequest, PagedResponse } from "@/shared/types/pagination"
import type {
  BulkCreateWordPayload,
  CreateWordSetPayload,
  GeminiWordsPayload,
  UpdateWordSetPayload,
  WordSet,
  WordWithProgress,
} from "./types"

const mapWordSetPayload = (payload: CreateWordSetPayload | UpdateWordSetPayload) => ({
  Title: payload.title,
  Description: payload.description,
  IsFavorite: payload.isFavorite ?? false,
})

const mapBulkWordsPayload = (words: BulkCreateWordPayload[]) =>
  words.map((word) => ({
    term: word.term,
    definition: word.definition,
    level: word.level,
  }))

export interface WordSetsService {
  query(request: PagedRequest): Promise<PagedResponse<WordSet>>
  list(): Promise<WordSet[]>
  get(id: string): Promise<WordSet>
  create(payload: CreateWordSetPayload): Promise<WordSet>
  update(id: string, payload: UpdateWordSetPayload): Promise<void>
  delete(id: string): Promise<void>
  getWords(id: string, request: PagedRequest): Promise<PagedResponse<WordWithProgress>>
  createWord(
    id: string,
    payload: { term: string; definition: string; level: number },
  ): Promise<WordWithProgress>
  createWordsBulk(id: string, payload: BulkCreateWordPayload[]): Promise<WordWithProgress[]>
  createWordsWithGemini(id: string, payload: GeminiWordsPayload): Promise<WordWithProgress[]>
  updateFavorite(id: string, isFavorite: boolean): Promise<WordSet>
  getFavorites(): Promise<WordSet[]>
}

export const wordSetsService: WordSetsService = {
  async query(request) {
    const response = await httpClient.post("/wordsets/query", request, { skipErrorToast: true })
    return response.data as PagedResponse<WordSet>
  },

  async list() {
    const response = await httpClient.get("/wordsets")
    return response.data as WordSet[]
  },

  async get(id) {
    const response = await httpClient.get(`/wordsets/${id}`)
    return response.data as WordSet
  },

  async create(payload) {
    const response = await httpClient.post("/wordsets", mapWordSetPayload(payload))
    return response.data as WordSet
  },

  async update(id, payload) {
    await httpClient.put(`/wordsets/${id}`, mapWordSetPayload(payload))
  },

  async delete(id) {
    await httpClient.delete(`/wordsets/${id}`)
  },

  async getWords(id, request) {
    const response = await httpClient.post(`/wordsets/${id}/words/query`, request)
    return response.data as PagedResponse<WordWithProgress>
  },

  async createWord(id, payload) {
    const response = await httpClient.post(`/wordsets/${id}/words`, payload)
    return response.data as WordWithProgress
  },

  async createWordsBulk(id, payload) {
    const response = await httpClient.post(`/wordsets/${id}/words/bulk`, {
      words: mapBulkWordsPayload(payload),
    })
    return response.data as WordWithProgress[]
  },

  async createWordsWithGemini(id, payload) {
    const response = await httpClient.post(`/wordsets/${id}/words/gemini`, payload)
    return response.data as WordWithProgress[]
  },

  async updateFavorite(id, isFavorite) {
    const response = await httpClient.patch(`/wordsets/${id}/favorite`, { IsFavorite: isFavorite })
    return response.data as WordSet
  },

  async getFavorites() {
    const response = await httpClient.get("/wordsets/favorites")
    return response.data as WordSet[]
  },
}
