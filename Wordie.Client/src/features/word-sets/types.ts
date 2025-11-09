import type {
	BulkCreateWordPayload,
	CreateWordSetPayload,
	GeminiWordsPayload,
	GeminiPreviewWord,
	UpdateWordSetPayload,
	WordSet,
	WordWithProgress,
} from "@/core/word-sets/types";

export type BulkCreateWordInput = BulkCreateWordPayload;
export type CreateWordSetRequest = CreateWordSetPayload;
export type GeminiWordsRequest = GeminiWordsPayload;
export type { GeminiPreviewWord };
export type UpdateWordSetRequest = UpdateWordSetPayload;
export type WordDto = WordWithProgress;

export interface WordSetDto extends WordSet {
	WordCount?: number;
	ReviewedCount?: number;
	CorrectRate?: number;
	UpdatedAt?: string;
}
