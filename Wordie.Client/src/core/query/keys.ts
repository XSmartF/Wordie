export const queryKeys = {
  wordSets: {
    root: ['wordSets'] as const,
    all: () => ['wordSets', 'all'] as const,
    detail: (id: string) => ['wordSets', 'detail', id] as const,
    words: (id: string) => ['wordSets', 'words', id] as const,
    wordsWithLimit: (id: string, limit: number | undefined) =>
      ['wordSets', 'words', id, { limit }] as const,
    favorites: () => ['wordSets', 'favorites'] as const,
  },
} as const
