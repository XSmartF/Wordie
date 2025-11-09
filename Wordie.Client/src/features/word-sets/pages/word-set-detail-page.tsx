import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconFiles,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconRepeat,
  IconSparkles,
  IconStar,
  IconTrash,
} from "@tabler/icons-react";
import { format, formatDistanceToNow } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

import { wordSetsApi } from "@/features/word-sets/api/word-sets-api";
import type {
  BulkCreateWordInput,
  GeminiPreviewWord,
  GeminiWordsRequest,
  WordDto,
  WordSetDto,
} from "@/features/word-sets/types";
import type {
  FilterRule,
  PagedResponse,
  SearchRule,
  SortDirection,
} from "@/shared/types/pagination";
import { PageSection, PageShell } from "@/shared/components/page";
import { Typography } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { SplitButton } from "@/shared/components/ui/split-button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Spinner } from "@/shared/components/ui/spinner";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  DataTable,
  type FilterFieldConfig,
  type FilterFieldOption,
  type TableButton,
} from "@/shared/components/data-table";
import { FormBuilder, type FormFieldConfig } from "@/shared/components/form/form-builder";
import { toast } from "sonner";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

const FLASHCARD_PAGE_SIZE = 100;
const COLUMN_FIELD_MAP = {
  header: "Term",
  definition: "Definition",
  definitionVietnamese: "DefinitionVietnamese",
  example: "Example",
  typeOfWord: "TypeOfWord",
  note: "Note",
  level: "Level",
  createdAt: "CreatedAt",
} as const;

const LEVEL_FILTER_OPTIONS = Array.from({ length: 5 }, (_, index) => {
  const level = index + 1;
  return {
    label: `Level ${level}`,
    value: level.toString(),
  };
});

const TYPE_OF_WORD_FILTER_OPTIONS: FilterFieldOption[] = [
  { label: "Noun", value: "Noun" },
  { label: "Pronoun", value: "Pronoun" },
  { label: "Verb", value: "Verb" },
  { label: "Adjective", value: "Adjective" },
  { label: "Adverb", value: "Adverb" },
  { label: "Preposition", value: "Preposition" },
  { label: "Conjunction", value: "Conjunction" },
  { label: "Interjection", value: "Interjection" },
  { label: "Grammar Structure", value: "GrammarStructure" },
];

const WORD_TABLE_SEARCH_COLUMNS: string[] = [
  "header",
  "definition",
  "definitionVietnamese",
  "example",
  "typeOfWord",
  "note",
];

const WORD_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    field: "header",
    label: "Term",
    type: "Text",
    placeholder: "Search by term",
  },
  {
    field: "definition",
    label: "Definition",
    type: "Text",
    placeholder: "Search by definition",
  },
  {
    field: "definitionVietnamese",
    label: "Definition (VI)",
    type: "Text",
    placeholder: "Tìm theo nghĩa tiếng Việt",
  },
  {
    field: "example",
    label: "Example",
    type: "Text",
    placeholder: "Search by example",
  },
  {
    field: "typeOfWord",
    label: "Type of Word",
    type: "Enum",
    operator: "Equal",
    options: TYPE_OF_WORD_FILTER_OPTIONS,
  },
  {
    field: "note",
    label: "Note",
    type: "Text",
    placeholder: "Search by note",
  },
  {
    field: "level",
    label: "Level",
    type: "Enum",
    operator: "Equal",
    options: LEVEL_FILTER_OPTIONS,
  },
  {
    field: "createdAt",
    label: "Added Date",
    type: "Date",
    operator: "Equal",
  },
];



type WordFlashcard = Pick<WordDto, "Id" | "Term" | "Definition"> & {
  CreatedAt: string;
};

type WordsState = PagedResponse<WordDto> | null;

type WordRow = {
  id: string;
  header: string;
  definition: string;
  definitionVietnamese: string;
  example: string;
  typeOfWord: string;
  note: string;
  level: number;
  createdAt: string;
  original: WordDto;
};

type FetchError = string | null;

const singleWordFormSchema = z.object({
  term: z.string().trim().min(1, "Vui lòng nhập từ vựng"),
  definition: z.string().trim().min(1, "Vui lòng nhập định nghĩa"),
  level: z
    .number()
    .min(1, "Độ khó tối thiểu là 1")
    .max(10, "Độ khó tối đa là 10"),
});

type SingleWordFormValues = z.infer<typeof singleWordFormSchema>;

type GeminiEditableWord = {
  id: string;
  term: string;
  definition: string;
  definitionVietnamese?: string | null;
  example?: string | null;
  typeOfWord?: string | null;
  note?: string | null;
  level: number;
};

const createPreviewWordId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const clampLevel = (value: number, fallback: number) => {
  const baseline = Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(Math.round(baseline), 1), 10);
};

const normalizeOptionalString = (value?: string | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const formatTypeOfWord = (value?: string | null) => {
  if (typeof value !== "string" || value.trim().length === 0) return "";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const valueOrEmpty = (value?: string | null) => (typeof value === "string" ? value.trim() : "");

const highlightTermInExample = (example: string, term: string) => {
  if (!example || !term) return example;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(\\b${escapedTerm}\\b)`, "gi");
  return example.replace(pattern, "<mark>$1</mark>");
};

const toEditableGeminiWord = (word: GeminiPreviewWord, fallbackLevel: number): GeminiEditableWord => ({
  id: createPreviewWordId(),
  term: word.Term?.trim() ?? "",
  definition: word.Definition?.trim() ?? "",
  definitionVietnamese: word.DefinitionVietnamese ?? null,
  example: word.Example ?? null,
  typeOfWord: word.TypeOfWord ?? null,
  note: word.Note ?? null,
  level: clampLevel(word.Level ?? fallbackLevel, fallbackLevel),
});

function FlashcardDeck({
  words,
  loading,
  error,
  onShuffle,
  onRetry,
}: {
  words: WordFlashcard[];
  loading: boolean;
  error: FetchError;
  onShuffle: () => void;
  onRetry: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
  }, [words]);

  const handleReveal = () => {
    setRevealed((value) => !value);
  };

  const handleNext = () => {
    setRevealed(false);
    setIndex((value) => Math.min(value + 1, words.length - 1));
  };

  const handlePrevious = () => {
    setRevealed(false);
    setIndex((value) => Math.max(value - 1, 0));
  };

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconRepeat className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Unable to load flashcards</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </Empty>
    );
  }

  if (words.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconRepeat className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No words available</EmptyTitle>
          <EmptyDescription>
            Add words to this set to start practicing with flashcards.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const current = words[index];
  const hasPrevious = index > 0;
  const hasNext = index < words.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative mx-auto w-full max-w-lg perspective-1000">
        <div
          className={`relative h-64 w-full cursor-pointer transform-style-preserve-3d rounded-xl border bg-card p-6 text-center shadow-sm transition-transform duration-300 ${
            revealed ? "rotate-y-180" : ""
          }`}
          onClick={handleReveal}
        >
          <div className="absolute inset-0 flex h-full w-full flex-col justify-center gap-4 backface-hidden">
            <span className="text-xs uppercase text-muted-foreground">
              Card {index + 1} of {words.length}
            </span>
            <span className="text-2xl font-semibold text-foreground">{current.Term}</span>
            <span className="text-sm text-muted-foreground">Tap to reveal the definition</span>
          </div>
          <div className="absolute inset-0 flex h-full w-full flex-col justify-center gap-4 backface-hidden rotate-y-180">
            <span className="text-xs uppercase text-muted-foreground">Definition</span>
            <span className="px-2 text-lg leading-relaxed text-foreground">{current.Definition}</span>
            <span className="text-sm text-muted-foreground">Tap to show the term</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="order-2 gap-2 sm:order-1"
        >
          <IconChevronLeft className="size-4" /> Previous
        </Button>
        <div className="order-1 flex justify-center gap-2 sm:order-2">
          <Button variant="default" size="sm" onClick={handleReveal} className="min-w-28">
            {revealed ? "Hide" : "Reveal"}
          </Button>
          <Button variant="outline" size="sm" onClick={onShuffle} className="gap-2">
            <IconRefresh className="size-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext}
          className="order-3 gap-2"
        >
          Next <IconChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const WordSetDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [wordSet, setWordSet] = useState<WordSetDto | null>(null);
  const [wordSetLoading, setWordSetLoading] = useState(true);
  const [wordSetError, setWordSetError] = useState<FetchError>(null);

  const [wordPage, setWordPage] = useState(1);
  const [wordPageSize, setWordPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [sortRules, setSortRules] = useState<{
    field: string;
    direction: SortDirection;
  }[]>([]);
  const [wordsState, setWordsState] = useState<WordsState>(null);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordsError, setWordsError] = useState<FetchError>(null);

  const [flashcards, setFlashcards] = useState<WordFlashcard[]>([]);
  const [flashLoading, setFlashLoading] = useState(false);
  const [flashError, setFlashError] = useState<FetchError>(null);

  const [addWordDialogOpen, setAddWordDialogOpen] = useState(false);
  const [addWordSubmitting, setAddWordSubmitting] = useState(false);
  const [singleDefaultValues, setSingleDefaultValues] = useState<SingleWordFormValues>({
    term: "",
    definition: "",
    level: 1,
  });

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLevel, setBulkLevel] = useState(1);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [geminiDialogOpen, setGeminiDialogOpen] = useState(false);
  const [geminiPrompt, setGeminiPrompt] = useState("");
  const [geminiPreviewWords, setGeminiPreviewWords] = useState<GeminiEditableWord[]>([]);
  const [geminiPreviewLoading, setGeminiPreviewLoading] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const geminiPreviewCount = geminiPreviewWords.length;
  const hasGeminiPreview = geminiPreviewCount > 0;
  const isGeminiBusy = geminiPreviewLoading || geminiSaving;

  const openAddWordDialog = useCallback(() => {
    setSingleDefaultValues({ term: "", definition: "", level: 1 });
    setAddWordDialogOpen(true);
  }, []);

  const closeAddWordDialog = useCallback(() => {
    if (addWordSubmitting) return;
    setAddWordDialogOpen(false);
  }, [addWordSubmitting]);

  const openBulkDialog = useCallback(() => {
    setBulkError(null);
    setBulkInput("");
    setBulkLevel(1);
    setBulkDialogOpen(true);
  }, []);

  const closeBulkDialog = useCallback(() => {
    if (bulkSubmitting) return;
    setBulkDialogOpen(false);
  }, [bulkSubmitting]);

  const openGeminiDialog = useCallback(() => {
    setGeminiError(null);
    setGeminiPrompt("");
    setGeminiPreviewWords([]);
    setGeminiDialogOpen(true);
  }, []);

  const closeGeminiDialog = useCallback(() => {
    if (geminiPreviewLoading || geminiSaving) return;
    setGeminiDialogOpen(false);
    setGeminiPreviewWords([]);
  }, [geminiPreviewLoading, geminiSaving]);


  const fetchWordSet = useCallback(async () => {
    if (!id) return;
    setWordSetLoading(true);
    setWordSetError(null);

    try {
      const result = await wordSetsApi.get(id);
      setWordSet(result);
    } catch (error) {
      console.error("Failed to load word set", error);
      setWordSet(null);
      setWordSetError("Unable to load this word set.");
    } finally {
      setWordSetLoading(false);
    }
  }, [id]);

  const fetchWords = useCallback(async () => {
    if (!id) return;
    setWordsLoading(true);
    setWordsError(null);

    try {
      const request: Parameters<typeof wordSetsApi.getWords>[1] = {
        Page: wordPage,
        PageSize: wordPageSize,
      };

      if (searchKeyword) {
        const apiSearchColumns = WORD_TABLE_SEARCH_COLUMNS.map((column) =>
          COLUMN_FIELD_MAP[column as keyof typeof COLUMN_FIELD_MAP] ?? column
        );
        const searchRule: SearchRule = {
          Columns: Array.from(new Set(apiSearchColumns)),
          Keyword: searchKeyword,
        };
        request.Search = searchRule;
      }

      if (filterRules.length > 0) {
        request.Filters = filterRules.map((rule) => {
          const mappedField =
            COLUMN_FIELD_MAP[
              rule.Field as keyof typeof COLUMN_FIELD_MAP
            ] ?? rule.Field;

          let normalizedValue = rule.Value;

          if (rule.Type === "Number" && typeof rule.Value === "string") {
            const numericValue = Number(rule.Value);
            normalizedValue = Number.isNaN(numericValue) ? rule.Value : numericValue;
          }

          if (rule.Type === "Enum" && typeof rule.Value === "string") {
            const numericValue = Number(rule.Value);
            normalizedValue = Number.isNaN(numericValue) ? rule.Value : numericValue;
          }

          if (rule.Type === "MultiSelect" && Array.isArray(rule.Value)) {
            normalizedValue = rule.Value.map((value) => {
              const numericValue = Number(value);
              return Number.isNaN(numericValue) ? value : numericValue;
            });
          }

          if (
            rule.Type === "Range" &&
            rule.Value &&
            typeof rule.Value === "object" &&
            !Array.isArray(rule.Value)
          ) {
            const rangeValue = rule.Value as { Min?: number; Max?: number };
            normalizedValue = {
              Min:
                typeof rangeValue.Min === "number"
                  ? rangeValue.Min
                  : rangeValue.Min !== undefined
                  ? Number(rangeValue.Min)
                  : undefined,
              Max:
                typeof rangeValue.Max === "number"
                  ? rangeValue.Max
                  : rangeValue.Max !== undefined
                  ? Number(rangeValue.Max)
                  : undefined,
            };
          }

          return {
            ...rule,
            Field: mappedField,
            Value: normalizedValue,
          };
        });
      }

      if (sortRules.length > 0) {
        request.Sorts = sortRules.map((sort) => ({
          Field:
            COLUMN_FIELD_MAP[
              sort.field as keyof typeof COLUMN_FIELD_MAP
            ] ?? sort.field,
          Direction: sort.direction,
        }));
      }

      const response: PagedResponse<WordDto> = await wordSetsApi.getWords(id, request);

      setWordsState(response);
    } catch (error) {
      console.error("Failed to load words", error);
      setWordsError("Unable to load words for this set.");
      setWordsState(null);
    } finally {
      setWordsLoading(false);
    }
  }, [id, wordPage, wordPageSize, searchKeyword, filterRules, sortRules]);

  const fetchFlashcards = useCallback(async () => {
    if (!id) return;
    setFlashLoading(true);
    setFlashError(null);

    try {
      const collected: WordFlashcard[] = [];
      let nextPage = 1;
      let hasNext = true;

      while (hasNext) {
        const response = await wordSetsApi.getWords(id, {
          Page: nextPage,
          PageSize: FLASHCARD_PAGE_SIZE,
        });

        collected.push(
          ...response.Items.map((word) => ({
            Id: word.Id,
            Term: word.Term,
            Definition: word.Definition,
            CreatedAt: word.CreatedAt,
          }))
        );

        hasNext = response.HasNext;
        nextPage += 1;
      }

      const shuffled = collected
        .map((item) => ({ item, weight: Math.random() }))
        .sort((a, b) => a.weight - b.weight)
        .map(({ item }) => item);

      setFlashcards(shuffled);
    } catch (error) {
      console.error("Failed to load flashcards", error);
      setFlashError("Unable to prepare flashcards right now.");
      setFlashcards([]);
    } finally {
      setFlashLoading(false);
    }
  }, [id]);

  const shuffleFlashcards = useCallback(() => {
    setFlashcards((current) =>
      current
        .map((item) => ({ item, weight: Math.random() }))
        .sort((a, b) => a.weight - b.weight)
        .map(({ item }) => item)
    );
  }, []);

  const parseBulkWords = useCallback(
    (raw: string, fallbackLevel: number) => {
      const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const items: BulkCreateWordInput[] = [];
      const issues: string[] = [];

      lines.forEach((line, index) => {
        const parts = line.includes("|") ? line.split("|") : line.split("-");
        const [termSegment, definitionSegment, levelSegment] = parts.map((segment) => segment.trim());

        if (!termSegment || !definitionSegment) {
          issues.push(`Dòng ${index + 1}: Vui lòng dùng định dạng "term | definition | level".`);
          return;
        }

        const parsedLevel = levelSegment ? Number(levelSegment) : fallbackLevel;
        const normalizedLevel = Number.isFinite(parsedLevel) && parsedLevel > 0
          ? Math.min(Math.max(Math.round(parsedLevel), 1), 10)
          : fallbackLevel;

        items.push({
          term: termSegment,
          definition: definitionSegment,
          level: normalizedLevel,
        });
      });

      return { items, issues };
    },
    [],
  );

  const handleGeminiPreview = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!id) return;

      const prompt = geminiPrompt.trim();
      if (!prompt) {
        setGeminiError("Vui lòng mô tả yêu cầu cho Gemini.");
        return;
      }

      setGeminiPreviewLoading(true);
      setGeminiError(null);

      try {
        const payload: GeminiWordsRequest = { prompt };
        const fallbackLevel = 1;
        const preview = await wordSetsApi.generateWordsWithGemini(payload);
        const normalized = preview.map((word) => toEditableGeminiWord(word, fallbackLevel));

        setGeminiPreviewWords(normalized);

        if (normalized.length === 0) {
          toast.info("Gemini không trả về đề xuất nào. Hãy thử yêu cầu cụ thể hơn.");
        } else {
          toast.success(`Gemini đã gợi ý ${normalized.length} từ. Chỉnh sửa trước khi lưu.`);
        }
      } catch (error) {
        console.error("Failed to preview words with Gemini", error);
        const message =
          error instanceof Error ? error.message : "Gemini đang bận, vui lòng thử lại.";
        setGeminiError(message);
        toast.error(message);
      } finally {
        setGeminiPreviewLoading(false);
      }
    },
  [geminiPrompt, id],
  );

  const handleGeminiWordChange = useCallback(
    (
      wordId: string,
      field:
        | "term"
        | "definition"
        | "definitionVietnamese"
        | "example"
        | "typeOfWord"
        | "note"
        | "level",
      value: string,
    ) => {
      setGeminiPreviewWords((words) =>
        words.map((word) => {
          if (word.id !== wordId) return word;
          if (field === "level") {
            const parsed = Number(value);
            return {
              ...word,
              level: clampLevel(parsed, word.level),
            };
          }

          if (field === "term" || field === "definition") {
            return {
              ...word,
              [field]: value,
            } as GeminiEditableWord;
          }

          const hasContent = value.trim().length > 0;

          return {
            ...word,
            [field]: hasContent ? value : null,
          } as GeminiEditableWord;
        }),
      );
    },
    [],
  );

  const handleGeminiWordRemove = useCallback((wordId: string) => {
    setGeminiPreviewWords((words) => words.filter((word) => word.id !== wordId));
  }, []);

  const handleGeminiAddEmpty = useCallback(() => {
    const fallback = 1;
    setGeminiPreviewWords((words) => [
      ...words,
      {
        id: createPreviewWordId(),
        term: "",
        definition: "",
        level: fallback,
      },
    ]);
  }, []);

  const handleGeminiClearPreview = useCallback(() => {
    setGeminiPreviewWords([]);
  }, []);

  const handleGeminiSave = useCallback(async () => {
    if (!id) return;

    const fallback = 1;
    const sanitized = geminiPreviewWords
      .map<BulkCreateWordInput>((word) => ({
        term: word.term.trim(),
        definition: word.definition.trim(),
        definitionVietnamese: normalizeOptionalString(word.definitionVietnamese),
        example: normalizeOptionalString(word.example),
        typeOfWord: normalizeOptionalString(word.typeOfWord),
        note: normalizeOptionalString(word.note),
        level: clampLevel(word.level, fallback),
      }))
      .filter((word) => word.term.length > 0 && word.definition.length > 0);

    if (sanitized.length === 0) {
      setGeminiError("Không có từ hợp lệ để lưu. Vui lòng kiểm tra lại danh sách.");
      return;
    }

    const removedCount = geminiPreviewWords.length - sanitized.length;

    setGeminiSaving(true);
    setGeminiError(null);

    try {
      const created = await wordSetsApi.createWordsBulk(id, sanitized);
      if (removedCount > 0) {
        toast.info(`${removedCount} mục trống đã bị bỏ qua.`);
      }
      toast.success(`Đã thêm ${created.length} từ vào bộ hiện tại.`);
      setGeminiDialogOpen(false);
      setGeminiPreviewWords([]);
      setGeminiPrompt("");
      await Promise.all([fetchWords(), fetchWordSet()]);
    } catch (error) {
      console.error("Failed to save Gemini words", error);
      const message = error instanceof Error ? error.message : "Không thể lưu từ lúc này.";
      setGeminiError(message);
      toast.error(message);
    } finally {
      setGeminiSaving(false);
    }
  }, [fetchWordSet, fetchWords, geminiPreviewWords, id]);

  const handleSingleWordSubmit = useCallback(
    async (values: SingleWordFormValues) => {
      if (!id) return;

      const trimmedTerm = values.term.trim();
      const trimmedDefinition = values.definition.trim();
      const normalizedLevel =
        Number.isFinite(values.level) && values.level > 0 ? Math.round(values.level) : 1;

      if (!trimmedTerm || !trimmedDefinition) {
        toast.error("Vui lòng nhập đầy đủ từ và định nghĩa.");
        return;
      }

      setAddWordSubmitting(true);

      try {
        await wordSetsApi.createWord(id, {
          term: trimmedTerm,
          definition: trimmedDefinition,
          level: Math.min(Math.max(normalizedLevel, 1), 10),
        });

        toast.success(`Đã thêm "${trimmedTerm}" vào word set.`);
        setSingleDefaultValues({ term: "", definition: "", level: normalizedLevel });
        setAddWordDialogOpen(false);
        await Promise.all([fetchWords(), fetchWordSet()]);
      } catch (error) {
        console.error("Failed to add word", error);
        const message = error instanceof Error ? error.message : "Không thể thêm từ mới.";
        toast.error(message);
      } finally {
        setAddWordSubmitting(false);
      }
    },
    [fetchWordSet, fetchWords, id],
  );

  const handleBulkSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!id) return;

      setBulkError(null);

      const fallbackLevel = Math.min(Math.max(bulkLevel, 1), 10);
      const { items, issues } = parseBulkWords(bulkInput, fallbackLevel);

      if (issues.length > 0) {
        setBulkError(issues.join(" "));
      }

      if (items.length === 0) {
        if (issues.length === 0) {
          setBulkError("Vui lòng nhập ít nhất một dòng hợp lệ theo định dạng term | definition | level.");
        }
        return;
      }

      setBulkSubmitting(true);

      try {
        const created = await wordSetsApi.createWordsBulk(id, items);
        toast.success(`Đã thêm ${created.length} từ mới.`);
        setBulkDialogOpen(false);
        setBulkInput("");
        await Promise.all([fetchWords(), fetchWordSet()]);
      } catch (error) {
        console.error("Failed to add words in bulk", error);
        const message = error instanceof Error ? error.message : "Không thể thêm nhiều từ lúc này.";
        setBulkError(message);
        toast.error(message);
      } finally {
        setBulkSubmitting(false);
      }
    },
    [bulkInput, bulkLevel, fetchWordSet, fetchWords, id, parseBulkWords],
  );


  useEffect(() => {
    void fetchWordSet();
  }, [fetchWordSet]);

  useEffect(() => {
    void fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    void fetchFlashcards();
  }, [fetchFlashcards]);

  const wordSetCreatedAt = useMemo(() => {
    if (!wordSet) return "";
    return format(new Date(wordSet.CreatedAt), "MMM d, yyyy");
  }, [wordSet]);

  const wordCount = wordsState?.TotalCount ?? 0;

  const addWordMenuItems = useMemo(
    () => [
      {
        key: "bulk",
        label: "Thêm nhiều",
        icon: <IconFiles className="size-4" />,
        onSelect: () => {
          openBulkDialog();
        },
        disabled: bulkSubmitting,
      },
      {
        key: "gemini",
        label: "Gemini",
        icon: <IconSparkles className="size-4" />,
        onSelect: () => {
          openGeminiDialog();
        },
        disabled: geminiPreviewLoading || geminiSaving,
      },
    ],
    [bulkSubmitting, geminiPreviewLoading, geminiSaving, openBulkDialog, openGeminiDialog],
  );

  const wordRows = useMemo<WordRow[]>(() => {
    if (!wordsState) return [];

    return wordsState.Items.map((word) => ({
      id: word.Id,
      header: word.Term,
      definition: word.Definition,
      definitionVietnamese: valueOrEmpty(word.DefinitionVietnamese),
      example: valueOrEmpty(word.Example),
      typeOfWord: formatTypeOfWord(word.TypeOfWord),
      note: valueOrEmpty(word.Note),
      level: word.Level,
      createdAt: format(new Date(word.CreatedAt), "MMM d, yyyy"),
      original: word,
    }));
  }, [wordsState]);

  const singleWordFields = useMemo<FormFieldConfig<SingleWordFormValues>[]>(
    () => [
      {
        name: "term",
        label: "Từ vựng",
        type: "text",
        placeholder: "Ví dụ: impetus",
        required: true,
      },
      {
        name: "definition",
        label: "Định nghĩa",
        type: "textarea",
        placeholder: "Định nghĩa hoặc ghi chú",
        required: true,
        rows: 4,
      },
      {
        name: "level",
        label: "Độ khó",
        type: "number",
        min: 1,
        max: 10,
        required: true,
        helperText: "Giá trị từ 1 đến 10",
      },
    ],
    [],
  );

  const wordColumns = useMemo<ColumnDef<WordRow>[]>(
    () => [
      {
        id: "term",
        accessorKey: "header",
        header: "Term",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.header}</span>
        ),
      },
      {
        id: "definition",
        accessorKey: "definition",
        header: "Definition",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-pre-line text-foreground">{row.original.definition}</span>
        ),
      },
      {
        id: "definitionVietnamese",
        accessorKey: "definitionVietnamese",
        header: "Nghĩa tiếng Việt",
        enableSorting: false,
        cell: ({ row }) => (
          row.original.definitionVietnamese ? (
            <span className="whitespace-pre-line text-foreground">{row.original.definitionVietnamese}</span>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )
        ),
      },
      {
        id: "example",
        accessorKey: "example",
        header: "Ví dụ",
        enableSorting: false,
        cell: ({ row }) => {
          if (!row.original.example) {
            return <span className="text-muted-foreground/60">—</span>;
          }

          const highlighted = highlightTermInExample(row.original.example, row.original.header);

          return (
            <span
              className="whitespace-pre-line italic text-foreground/90"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          );
        },
      },
      {
        id: "typeOfWord",
        accessorKey: "typeOfWord",
        header: "Loại từ",
        enableSorting: false,
        cell: ({ row }) => (
          row.original.typeOfWord ? (
            <Badge variant="outline" className="px-2 py-0 text-[0.65rem] capitalize">
              {row.original.typeOfWord}
            </Badge>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )
        ),
      },
      {
        id: "note",
        accessorKey: "note",
        header: "Ghi chú",
        enableSorting: false,
        cell: ({ row }) => (
          row.original.note ? (
            <span className="whitespace-pre-line text-foreground">{row.original.note}</span>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )
        ),
      },
      {
        id: "level",
        accessorKey: "level",
        header: () => <div className="text-right">Level</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Badge variant="secondary" className="px-2 py-0 text-[0.7rem]">
              Lv {row.original.level}
            </Badge>
          </div>
        ),
      },
      {
        id: "added",
        accessorKey: "createdAt",
        header: () => <div className="text-right">Added</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">{row.original.createdAt}</div>
        ),
      },
    ],
    []
  );

  const wordTableButtons = useMemo<TableButton<WordRow>[]>(
    () => [
      {
        key: "edit",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconEdit className="size-4" /> Chỉnh sửa
          </span>
        ),
        onClick: (selected) => {
          if (selected.length !== 1) return;
          const word = selected[0];
          toast.info(`Edit word "${word.header}" (ID: ${word.id})`);
        },
        disabled: (selected) => selected.length !== 1,
      },
      {
        key: "delete",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconTrash className="size-4" /> Xóa
          </span>
        ),
        variant: "danger",
        onClick: (selected) => {
          if (selected.length === 0) return;
          toast.info(
            `Delete ${selected.length} word${selected.length > 1 ? "s" : ""}`
          );
        },
        disabled: (selected) => selected.length === 0,
      },
    ],
    [],
  );

  const handleTableSearchChange = useCallback((search: SearchRule | undefined) => {
    setSearchKeyword(search?.Keyword ?? "");
    setWordPage(1);
  }, []);

  const handleTableFiltersChange = useCallback((filters: FilterRule[]) => {
    setFilterRules(filters);
    setWordPage(1);
  }, []);

  const handleTableSortChange = useCallback(
    (sorts: { field: string; direction: SortDirection }[]) => {
      setSortRules(sorts);
      setWordPage(1);
    },
    []
  );

  const handleTablePageChange = useCallback((pageIndex: number) => {
    setWordPage(pageIndex + 1);
  }, []);

  const handleTablePageSizeChange = useCallback((size: number) => {
    setWordPageSize(size);
    setWordPage(1);
  }, []);

  const handleRefreshAll = () => {
    void fetchWordSet();
    void fetchWords();
    void fetchFlashcards();
  };

  const toggleFavorite = async () => {
    if (!id || !wordSet) return;
    try {
      const updated = await wordSetsApi.updateFavorite(id, !wordSet.IsFavorite);
      setWordSet(updated);
    } catch (err) {
      console.error("Failed to update favorite", err);
      toast.error("Unable to update favorite right now.");
    }
  };

  if (!id) {
    return (
      <PageShell>
        <PageSection>
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>Word set not found</EmptyTitle>
              <EmptyDescription>
                The requested word set identifier is missing. Go back and try again.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Empty>
        </PageSection>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageSection>
        <Card>
          <CardHeader>
            {wordSetLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : wordSetError ? (
              <div className="flex flex-col gap-2">
                <CardTitle className="text-base">Unable to load word set</CardTitle>
                <CardDescription>{wordSetError}</CardDescription>
              </div>
            ) : wordSet ? (
              <>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {wordSet.Title}
                </CardTitle>
                <CardDescription>
                  {wordSet.Description ? wordSet.Description : "No description provided."}
                </CardDescription>
                <CardAction>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/study?wordSetId=${wordSet.Id}`)}
                    >
                      <IconPlayerPlay className="size-4" /> Học ngay
                    </Button>
                    <Button
                      variant={wordSet.IsFavorite ? "secondary" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={toggleFavorite}
                      disabled={wordSetLoading}
                    >
                      <IconStar className="size-4" />
                      {wordSet.IsFavorite ? "Favorited" : "Favorite"}
                    </Button>
                    <div className="flex-1" />
                    <SplitButton
                      size="sm"
                      primaryAction={{
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <IconPlus className="size-4" /> 
                            <span className="hidden sm:inline">Thêm từ</span>
                          </span>
                        ),
                        onClick: openAddWordDialog,
                        disabled: addWordSubmitting,
                      }}
                      options={addWordMenuItems}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleRefreshAll}
                      disabled={wordSetLoading || wordsLoading || flashLoading}
                    >
                      <IconRefresh className="size-4" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </CardAction>
              </>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {wordSetLoading ? (
              <Skeleton className="h-4 w-44" />
            ) : (
              <div className="flex flex-col gap-1 text-sm">
                <Typography variant="muted">Created</Typography>
                <Typography className="font-medium text-foreground">{wordSetCreatedAt}</Typography>
                <Typography variant="muted" className="text-xs">
                  {wordSet &&
                    `Last updated ${formatDistanceToNow(new Date(wordSet.CreatedAt), {
                      addSuffix: true,
                    })}`}
                </Typography>
              </div>
            )}
            <div className="flex flex-col gap-1 text-sm">
              <Typography variant="muted">Words</Typography>
              {wordsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <Typography className="font-medium text-foreground">
                  {wordCount.toLocaleString()} words in this set
                </Typography>
              )}
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-base">Words in this set</CardTitle>
            <CardDescription>
              Browse, search, and filter the words that belong to this set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wordsError ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyTitle>Unable to load words</EmptyTitle>
                  <EmptyDescription>{wordsError}</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" size="sm" onClick={() => void fetchWords()}>
                  Try again
                </Button>
              </Empty>
            ) : (
              <DataTable
                data={wordRows}
                columns={wordColumns}
                loading={wordsLoading}
                enableTabs={false}
                enableDragAndDrop={false}
                selectable
                buttons={wordTableButtons}
                filters={filterRules}
                filterFields={WORD_FILTER_FIELDS}
                searchableColumns={WORD_TABLE_SEARCH_COLUMNS}
                onSearchChange={handleTableSearchChange}
                onFiltersChange={handleTableFiltersChange}
                onSortChange={handleTableSortChange}
                pagination={{
                  pageIndex: wordPage - 1,
                  pageSize: wordPageSize,
                  totalPages: wordsState?.TotalPages,
                  totalCount: wordsState?.TotalCount,
                  hasNext: wordsState?.HasNext,
                  hasPrevious: wordsState?.HasPrevious,
                  onPageChange: handleTablePageChange,
                  onPageSizeChange: handleTablePageSizeChange,
                }}
              />
            )}
          </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-base">Flashcards</CardTitle>
            <CardDescription>
              Cycle through every word in this set and test yourself on definitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FlashcardDeck
              words={flashcards}
              loading={flashLoading}
              error={flashError}
              onShuffle={shuffleFlashcards}
              onRetry={() => void fetchFlashcards()}
            />
          </CardContent>
        </Card>
      </PageSection>

      <ResponsiveDialog
        open={addWordDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeAddWordDialog();
          } else {
            setAddWordDialogOpen(true);
          }
        }}
        title="Thêm từ mới"
        description="Điền từ vựng và định nghĩa. Bạn có thể quản lý độ khó để phù hợp với lộ trình học."
        desktopContentClassName="max-w-lg"
      >
        <FormBuilder<SingleWordFormValues>
          fields={singleWordFields}
          defaultValues={singleDefaultValues}
          onSubmit={handleSingleWordSubmit}
          submitting={addWordSubmitting}
          submitLabel="Thêm từ"
          cancelLabel="Hủy"
          onCancel={closeAddWordDialog}
          schema={singleWordFormSchema}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={bulkDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeBulkDialog();
          } else {
            setBulkDialogOpen(true);
          }
        }}
        title="Thêm nhiều từ cùng lúc"
        description={(
          <>
            Mỗi dòng tương ứng với một từ theo định dạng: <code>term | definition | level</code>. Level có thể bỏ trống để dùng giá trị mặc định.
          </>
        )}
        desktopContentClassName="max-w-2xl"
      >
        <form className="flex flex-col gap-4" onSubmit={handleBulkSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-words">Danh sách từ</Label>
              <Textarea
                id="bulk-words"
                value={bulkInput}
                onChange={(event) => setBulkInput(event.target.value)}
                placeholder={`Ví dụ:\nphotosynthesis | the process by which plants make food | 3\nimpetus | a driving force | 2`}
                minLength={3}
                rows={10}
                disabled={bulkSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Hỗ trợ dấu <code>|</code> để phân tách. Nếu dòng không có level, sẽ dùng giá trị mặc định bên dưới.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="bulk-level">Level mặc định</Label>
                <Input
                  id="bulk-level"
                  type="number"
                  min={1}
                  max={10}
                  value={bulkLevel}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setBulkLevel(Number.isFinite(next) ? next : 1);
                  }}
                  disabled={bulkSubmitting}
                  className="w-32"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Áp dụng cho các dòng không chỉ định level riêng.
              </div>
            </div>
            {bulkError ? <p className="text-xs text-destructive">{bulkError}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeBulkDialog} disabled={bulkSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={bulkSubmitting || bulkInput.trim().length === 0}>
                {bulkSubmitting ? "Đang thêm..." : "Thêm vào set"}
              </Button>
            </div>
          </form>
      </ResponsiveDialog>
      <ResponsiveDialog
        open={geminiDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeGeminiDialog();
          } else {
            setGeminiDialogOpen(true);
          }
        }}
        title="Thêm từ với Gemini"
        description="Nhập yêu cầu để Gemini gợi ý danh sách từ vựng, sau đó chỉnh sửa trước khi lưu vào bộ hiện tại."
  desktopContentClassName="sm:max-w-7xl"
      >
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
          onSubmit={handleGeminiPreview}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gemini-prompt">Mô tả yêu cầu</Label>
              <Textarea
                id="gemini-prompt"
                value={geminiPrompt}
                onChange={(event) => setGeminiPrompt(event.target.value)}
                placeholder="Ví dụ: Gợi ý 8 từ vựng học thuật về công nghệ kèm định nghĩa, dịch nghĩa và câu ví dụ."
                rows={8}
                disabled={isGeminiBusy}
              />
              <p className="text-xs text-muted-foreground">
                Mô tả chủ đề, trình độ và các yêu cầu bổ sung (dịch nghĩa, câu ví dụ, loại từ...).
              </p>
            </div>

            <div className="max-w-full overflow-x-auto">
              <div className="flex w-max items-center gap-2 py-1 pr-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeminiAddEmpty}
                  disabled={isGeminiBusy}
                >
                  Thêm trống
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeminiClearPreview}
                  disabled={isGeminiBusy || !hasGeminiPreview}
                >
                  Xóa danh sách
                </Button>
              </div>
            </div>

            {geminiError ? (
              <p className="text-xs text-destructive">{geminiError}</p>
            ) : null}

            {hasGeminiPreview ? (
              <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                Đang có {geminiPreviewCount} gợi ý. Chỉnh sửa các trường bên phải trước khi lưu vào word set.
              </div>
            ) : (
              <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                Chưa có gợi ý. Điền yêu cầu và chọn <strong>Xem gợi ý</strong> để tạo danh sách.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Danh sách gợi ý</Label>
              {hasGeminiPreview ? (
                <span className="text-xs text-muted-foreground">{geminiPreviewCount} mục</span>
              ) : null}
            </div>

            <div className="min-h-80 rounded-lg border bg-muted/30">
              {geminiPreviewLoading && !hasGeminiPreview ? (
                <div className="flex h-full flex-col gap-3 p-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : hasGeminiPreview ? (
                <ScrollArea className="h-[420px]">
                  <div className="flex flex-col gap-4 p-4 pr-6">
                    {geminiPreviewWords.map((word, index) => (
                      <div
                        key={word.id}
                        className="rounded-lg border bg-card/60 p-4 shadow-sm transition hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">Gợi ý {index + 1}</p>
                            <p className="text-xs text-muted-foreground">Level {word.level}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeminiWordRemove(word.id)}
                            disabled={isGeminiBusy}
                            className="size-8 text-muted-foreground hover:text-destructive"
                          >
                            <IconTrash className="size-4" />
                            <span className="sr-only">Xóa gợi ý</span>
                          </Button>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor={`gemini-term-${word.id}`}>Từ vựng</Label>
                            <Input
                              id={`gemini-term-${word.id}`}
                              value={word.term}
                              onChange={(event) =>
                                handleGeminiWordChange(word.id, "term", event.target.value)
                              }
                              disabled={isGeminiBusy}
                              placeholder="Ví dụ: impetus"
                            />
                          </div>
                          <div className="flex flex-col gap-1 sm:w-28">
                            <Label htmlFor={`gemini-level-${word.id}`}>Độ khó</Label>
                            <Input
                              id={`gemini-level-${word.id}`}
                              type="number"
                              min={1}
                              max={10}
                              value={word.level}
                              onChange={(event) =>
                                handleGeminiWordChange(word.id, "level", event.target.value)
                              }
                              disabled={isGeminiBusy}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-1">
                          <Label htmlFor={`gemini-definition-${word.id}`}>Định nghĩa</Label>
                          <Textarea
                            id={`gemini-definition-${word.id}`}
                            value={word.definition}
                            rows={3}
                            onChange={(event) =>
                              handleGeminiWordChange(word.id, "definition", event.target.value)
                            }
                            disabled={isGeminiBusy}
                            placeholder="Giải thích bằng tiếng Anh"
                          />
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor={`gemini-definition-vi-${word.id}`}>
                              Dịch nghĩa (Tùy chọn)
                            </Label>
                            <Textarea
                              id={`gemini-definition-vi-${word.id}`}
                              value={word.definitionVietnamese ?? ""}
                              rows={3}
                              onChange={(event) =>
                                handleGeminiWordChange(
                                  word.id,
                                  "definitionVietnamese",
                                  event.target.value,
                                )
                              }
                              disabled={isGeminiBusy}
                              placeholder="Dịch sang tiếng Việt"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor={`gemini-example-${word.id}`}>
                              Ví dụ (Tùy chọn)
                            </Label>
                            <Textarea
                              id={`gemini-example-${word.id}`}
                              value={word.example ?? ""}
                              rows={3}
                              onChange={(event) =>
                                handleGeminiWordChange(word.id, "example", event.target.value)
                              }
                              disabled={isGeminiBusy}
                              placeholder="Ví dụ: The occurrence surprised everyone."
                            />
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor={`gemini-type-${word.id}`}>
                              Loại từ (Tùy chọn)
                            </Label>
                            <Input
                              id={`gemini-type-${word.id}`}
                              value={word.typeOfWord ?? ""}
                              onChange={(event) =>
                                handleGeminiWordChange(word.id, "typeOfWord", event.target.value)
                              }
                              disabled={isGeminiBusy}
                              placeholder="Ví dụ: Noun"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor={`gemini-note-${word.id}`}>
                              Ghi chú (Tùy chọn)
                            </Label>
                            <Textarea
                              id={`gemini-note-${word.id}`}
                              value={word.note ?? ""}
                              rows={2}
                              onChange={(event) =>
                                handleGeminiWordChange(word.id, "note", event.target.value)
                              }
                              disabled={isGeminiBusy}
                              placeholder="Thông tin bổ sung"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                  Chưa có gợi ý nào. Điền yêu cầu ở cột bên trái để bắt đầu.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 lg:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeGeminiDialog}
              disabled={isGeminiBusy}
            >
              Đóng
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={isGeminiBusy || geminiPrompt.trim().length === 0}
              >
                {geminiPreviewLoading ? "Đang tạo gợi ý..." : "Xem gợi ý"}
              </Button>
              <Button
                type="button"
                onClick={handleGeminiSave}
                disabled={isGeminiBusy || !hasGeminiPreview}
              >
                {geminiSaving ? "Đang lưu..." : `Lưu ${geminiPreviewCount} từ`}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveDialog>
    </PageShell>
  );
};

export default WordSetDetailPage;
