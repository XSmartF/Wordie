import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconFiles,
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
import type { BulkCreateWordInput, GeminiWordsRequest, WordSetDto } from "@/features/word-sets/types";
import type { WordDto } from "@/features/words/types";
import type {
  FilterRule,
  PagedResponse,
  SearchRule,
  SortDirection,
} from "@/shared/types/pagination";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
  type TableButton,
} from "@/shared/components/data-table";
import { FormBuilder, type FormFieldConfig } from "@/shared/components/form/form-builder";
import { toast } from "sonner";

const FLASHCARD_PAGE_SIZE = 100;
const COLUMN_FIELD_MAP = {
  header: "Term",
  definition: "Definition",
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
  level: number;
  createdAt: string;
  original: WordDto;
};

type FetchError = string | null;

type SingleWordFormValues = {
  term: string;
  definition: string;
  level: number;
};

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
      <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
        <div className="text-xs uppercase text-muted-foreground">
          Card {index + 1} of {words.length}
        </div>
        <div className="mt-4 text-2xl font-semibold text-foreground">
          {current.Term}
        </div>
        <div className="mt-6 text-base text-muted-foreground">
          {revealed ? current.Definition : "Tap reveal to see the definition"}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => hasPrevious && setIndex((value) => value - 1)}
          disabled={!hasPrevious}
          className="gap-2"
        >
          <IconChevronLeft className="size-4" /> Previous
        </Button>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setRevealed((value) => !value)}
            className="w-28"
          >
            {revealed ? "Hide" : "Reveal"}
          </Button>
          <Button variant="outline" size="sm" onClick={onShuffle} className="gap-2">
            <IconRefresh className="size-4" /> Shuffle
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => hasNext && setIndex((value) => value + 1)}
          disabled={!hasNext}
          className="gap-2"
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
  const [geminiMaxWords, setGeminiMaxWords] = useState<number | undefined>(10);
  const [geminiDefaultLevel, setGeminiDefaultLevel] = useState<number | undefined>(2);
  const [geminiSubmitting, setGeminiSubmitting] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

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
    setGeminiDialogOpen(true);
  }, []);

  const closeGeminiDialog = useCallback(() => {
    if (geminiSubmitting) return;
    setGeminiDialogOpen(false);
  }, [geminiSubmitting]);


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
        const searchRule: SearchRule = {
          Columns: ["Term", "Definition"],
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

  const handleSingleWordSubmit = useCallback(
    async (values: SingleWordFormValues) => {
      if (!id) return;

      const trimmedTerm = values.term.trim();
      const trimmedDefinition = values.definition.trim();
      const normalizedLevel = Number.isFinite(values.level) && values.level > 0 ? Math.round(values.level) : 1;

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

  const handleGeminiSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!id) return;

      const prompt = geminiPrompt.trim();
      if (!prompt) {
        setGeminiError("Vui lòng mô tả yêu cầu cho Gemini.");
        return;
      }

      setGeminiSubmitting(true);
      setGeminiError(null);

      try {
        const payload: GeminiWordsRequest = {
          prompt,
          defaultLevel: geminiDefaultLevel && geminiDefaultLevel > 0 ? Math.min(Math.round(geminiDefaultLevel), 10) : undefined,
          maxWords: geminiMaxWords && geminiMaxWords > 0 ? Math.min(Math.round(geminiMaxWords), 50) : undefined,
        };

        const created = await wordSetsApi.createWordsWithGemini(id, payload);

        if (created.length === 0) {
          toast.info("Gemini không trả về từ mới nào. Hãy thử mô tả cụ thể hơn.");
        } else {
          toast.success(`Gemini đã thêm ${created.length} từ.`);
        }

        setGeminiDialogOpen(false);
        await Promise.all([fetchWords(), fetchWordSet()]);
      } catch (error) {
        console.error("Failed to add words with Gemini", error);
        const message = error instanceof Error ? error.message : "Gemini đang bận, vui lòng thử lại.";
        setGeminiError(message);
        toast.error(message);
      } finally {
        setGeminiSubmitting(false);
      }
    },
    [fetchWordSet, fetchWords, geminiDefaultLevel, geminiMaxWords, geminiPrompt, id],
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

  const wordRows = useMemo<WordRow[]>(() => {
    if (!wordsState) return [];

    return wordsState.Items.map((word) => ({
      id: word.Id,
      header: word.Term,
      definition: word.Definition,
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
          <span className="text-muted-foreground">{row.original.definition}</span>
        ),
      },
      {
        id: "level",
        accessorKey: "level",
        header: () => <div className="text-right">Level</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">{row.original.level}</div>
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
        key: "add",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconPlus className="size-4" /> Thêm từ
          </span>
        ),
        variant: "primary",
        onClick: () => {
          openAddWordDialog();
        },
      },
      {
        key: "addMany",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconFiles className="size-4" /> Thêm nhiều
          </span>
        ),
        variant: "secondary",
        onClick: () => {
          openBulkDialog();
        },
      },
      {
        key: "gemini",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconSparkles className="size-4" /> Gemini
          </span>
        ),
        variant: "ghost",
        onClick: () => {
          openGeminiDialog();
        },
      },
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
    [openAddWordDialog, openBulkDialog, openGeminiDialog],
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
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
          <IconArrowLeft className="size-4" /> Back
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Word Set Details</h1>
      </div>

      <div className="px-4 lg:px-6">
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
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleRefreshAll}
                      disabled={wordSetLoading || wordsLoading || flashLoading}
                    >
                      <IconRefresh className="size-4" /> Refresh
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
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">{wordSetCreatedAt}</span>
                <span className="text-xs text-muted-foreground">
                  {wordSet &&
                    `Last updated ${formatDistanceToNow(new Date(wordSet.CreatedAt), {
                      addSuffix: true,
                    })}`}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Words</span>
              {wordsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="font-medium text-foreground">
                  {wordCount.toLocaleString()} words in this set
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
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
                searchableColumns={["header", "definition"]}
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
      </div>

      <div className="px-4 lg:px-6">
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
      </div>

      <Dialog
        open={addWordDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeAddWordDialog();
          } else {
            setAddWordDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm từ mới</DialogTitle>
            <DialogDescription>
              Điền từ vựng và định nghĩa. Bạn có thể quản lý độ khó để phù hợp với lộ trình học.
            </DialogDescription>
          </DialogHeader>
          <FormBuilder<SingleWordFormValues>
            fields={singleWordFields}
            defaultValues={singleDefaultValues}
            onSubmit={handleSingleWordSubmit}
            submitting={addWordSubmitting}
            submitLabel="Thêm từ"
            cancelLabel="Hủy"
            onCancel={closeAddWordDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeBulkDialog();
          } else {
            setBulkDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm nhiều từ cùng lúc</DialogTitle>
            <DialogDescription>
              Mỗi dòng tương ứng với một từ theo định dạng: <code>term | definition | level</code>. Level có thể bỏ trống để dùng giá trị mặc định.
            </DialogDescription>
          </DialogHeader>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeBulkDialog} disabled={bulkSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={bulkSubmitting || bulkInput.trim().length === 0}>
                {bulkSubmitting ? "Đang thêm..." : "Thêm vào set"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={geminiDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeGeminiDialog();
          } else {
            setGeminiDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm từ với Gemini</DialogTitle>
            <DialogDescription>
              Mô tả chủ đề hoặc dán danh sách từ khóa. Chúng tôi sẽ gửi <strong>một</strong> yêu cầu duy nhất tới Gemini và thêm toàn bộ kết quả trả về.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleGeminiSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gemini-prompt">Yêu cầu cho Gemini</Label>
              <Textarea
                id="gemini-prompt"
                value={geminiPrompt}
                onChange={(event) => setGeminiPrompt(event.target.value)}
                placeholder="Ví dụ: Tạo 5 từ vựng TOEIC về chủ đề logistics kèm định nghĩa tiếng Việt."
                rows={8}
                disabled={geminiSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Bạn có thể dán nhiều từ khóa cùng lúc; hệ thống chỉ gọi Gemini một lần với toàn bộ nội dung.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="gemini-default-level">Level mặc định</Label>
                <Input
                  id="gemini-default-level"
                  type="number"
                  min={1}
                  max={10}
                  value={geminiDefaultLevel ?? ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === "") {
                      setGeminiDefaultLevel(undefined);
                      return;
                    }
                    const parsed = Number(next);
                    setGeminiDefaultLevel(Number.isFinite(parsed) ? parsed : undefined);
                  }}
                  disabled={geminiSubmitting}
                />
                <p className="text-xs text-muted-foreground">Tùy chọn; áp dụng khi Gemini không trả về level.</p>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="gemini-max-words">Số từ tối đa</Label>
                <Input
                  id="gemini-max-words"
                  type="number"
                  min={1}
                  max={50}
                  value={geminiMaxWords ?? ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === "") {
                      setGeminiMaxWords(undefined);
                      return;
                    }
                    const parsed = Number(next);
                    setGeminiMaxWords(Number.isFinite(parsed) ? parsed : undefined);
                  }}
                  disabled={geminiSubmitting}
                />
                <p className="text-xs text-muted-foreground">Giới hạn tránh thêm quá nhiều từ một lần.</p>
              </div>
            </div>
            {geminiError ? <p className="text-xs text-destructive">{geminiError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeGeminiDialog} disabled={geminiSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={geminiSubmitting || geminiPrompt.trim().length === 0}>
                {geminiSubmitting ? "Đang gửi Gemini..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WordSetDetailPage;
