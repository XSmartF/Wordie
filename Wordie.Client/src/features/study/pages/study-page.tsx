import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { studyApi } from "@/features/study/api/study-api";
import {
  type StartStudySessionRequest,
  type StudyMode,
  STUDY_CARD_DIRECTION,
  STUDY_MODE,
} from "@/features/study/types";
import { wordSetsApi } from "@/features/word-sets/api/word-sets-api";
import { useWordSetListQuery } from "@/features/word-sets/hooks/use-word-set-list";
import { type WordSetDto, type WordDto } from "@/features/word-sets/types";
import { queryKeys } from "@/core/query/keys";
import { ComboBox } from "@/shared/components/combobox";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PagedRequest } from "@/shared/types/pagination";

import { PageHeader, PageSection, PageShell } from "@/shared/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Typography } from "@/shared/components/typography";

import { StudyControlPanel } from "../components/study-control-panel";
import { StudySessionWorkspace } from "../components/study-session-workspace";

const DEFAULT_SETTINGS: StartStudySessionRequest = {
  WordSetId: "",
  Mode: STUDY_MODE.Flashcard,
  Direction: STUDY_CARD_DIRECTION.TermToDefinition,
  Limit: 20,
  IncludeDue: true,
  IncludeNew: true,
  Shuffle: true,
  AllowFlip: true,
  AllowTyping: true,
};

const StudyPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<StartStudySessionRequest>(DEFAULT_SETTINGS);

  const wordSetQuery = useWordSetListQuery();

  useEffect(() => {
    const urlSessionId = searchParams.get("sessionId");
    setSessionId(urlSessionId);
  }, [searchParams]);

  useEffect(() => {
    const urlWordSetId = searchParams.get("wordSetId");
    if (!urlWordSetId) return;

    setSettings((prev) => {
      if (prev.WordSetId === urlWordSetId) {
        return prev;
      }
      return {
        ...prev,
        WordSetId: urlWordSetId,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (!wordSetQuery.data?.length) return;
    if (!settings.WordSetId) {
      setSettings((prev) => ({ ...prev, WordSetId: wordSetQuery.data?.[0]?.Id ?? "" }));
    }
  }, [settings.WordSetId, wordSetQuery.data]);

  const currentSet = useMemo<WordSetDto | null>(() => {
    if (!settings.WordSetId || !wordSetQuery.data) return null;
    return wordSetQuery.data.find((set) => set.Id === settings.WordSetId) ?? null;
  }, [settings.WordSetId, wordSetQuery.data]);

  const wordsQuery = useQuery<{ items: WordDto[] }, Error>({
    queryKey: queryKeys.wordSets.wordsWithLimit(
      settings.WordSetId ?? "unknown",
      settings.Limit ?? undefined,
    ),
    queryFn: async () => {
      if (!settings.WordSetId) {
        return { items: [] };
      }
      const request: PagedRequest = {
        Page: 1,
        PageSize: settings.Limit ?? 20,
      };
      const response = await wordSetsApi.getWords(settings.WordSetId, request);
      return { items: response.Items };
    },
    enabled: Boolean(settings.WordSetId),
  });

  const handleWordSetChange = useCallback((value: string) => {
    setSettings((prev) => {
      if (!value) {
        return prev;
      }
      if (prev.WordSetId === value) {
        return prev;
      }
      return { ...prev, WordSetId: value };
    });
  }, []);

  const handleModeChange = useCallback((value: StudyMode) => {
    setSettings((prev) => ({ ...prev, Mode: value }));
  }, []);

  const handleStartSession = useCallback(async () => {
    if (!settings.WordSetId) {
      toast.error("Vui lòng chọn bộ từ vựng để bắt đầu học.");
      return;
    }

    try {
      const payload: StartStudySessionRequest = {
        ...settings,
        Limit: settings.Limit && settings.Limit > 0 ? settings.Limit : 20,
      };

      const response = await studyApi.startSession(payload);
      setSessionId(response.Id);
      toast.success("Bắt đầu phiên học mới thành công.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể khởi tạo phiên học. Vui lòng thử lại.");
    }
  }, [settings]);
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      let changed = false;

      if (sessionId) {
        if (prev.get("sessionId") !== sessionId) {
          next.set("sessionId", sessionId);
          changed = true;
        }
      } else if (prev.has("sessionId")) {
        next.delete("sessionId");
        changed = true;
      }

      if (settings.WordSetId) {
        if (prev.get("wordSetId") !== settings.WordSetId) {
          next.set("wordSetId", settings.WordSetId);
          changed = true;
        }
      } else if (prev.has("wordSetId")) {
        next.delete("wordSetId");
        changed = true;
      }

      return changed ? next : prev;
    }, { replace: true });
  }, [sessionId, settings.WordSetId, setSearchParams]);

  const wordSetOptions = useMemo(
    () =>
      (wordSetQuery.data ?? []).map((set) => ({
        value: set.Id,
        label: set.Title,
      })),
    [wordSetQuery.data]
  );

  const studyModes = useMemo(
    () => [
      { value: String(STUDY_MODE.Flashcard), label: "Flashcard" },
      { value: String(STUDY_MODE.MultipleChoice), label: "Multiple choice" },
      { value: String(STUDY_MODE.Typing), label: "Typing" },
    ],
    []
  );

  return (
    <PageShell>
      <PageHeader
        title="Study"
        titleClassName="text-3xl font-bold"
        description="Kết hợp thuật toán spaced repetition và các chế độ luyện tập như Quizlet."
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <ComboBox
              items={wordSetOptions}
              value={settings.WordSetId}
              onChange={handleWordSetChange}
              placeholder={wordSetQuery.isLoading ? "Đang tải bộ từ..." : "Chọn bộ từ"}
              className="min-w-60"
              disabled={wordSetQuery.isLoading || wordSetOptions.length === 0}
            />

            <Select
              value={String(settings.Mode)}
              onValueChange={(value) => handleModeChange(Number(value) as StudyMode)}
            >
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Chế độ học" />
              </SelectTrigger>
              <SelectContent align="end">
                {studyModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleStartSession} disabled={!settings.WordSetId}>
              Bắt đầu học
            </Button>
          </div>
        }
      />

      <PageSection className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(360px,420px)_1fr]">
        <div className="space-y-4">
          <Typography variant="h3">Study control</Typography>
          <StudyControlPanel
            isLoading={wordSetQuery.isLoading}
            wordSet={currentSet}
            settings={settings}
            onChangeSettings={setSettings}
            availableWords={wordsQuery.data?.items ?? []}
          />
        </div>

        <Card className="min-h-[480px]">
          <CardHeader>
            <CardTitle>Khu vực học</CardTitle>
          </CardHeader>
          <CardContent>
            <StudySessionWorkspace sessionId={sessionId} settings={settings} />
          </CardContent>
        </Card>
      </PageSection>
    </PageShell>
  );
};

export default StudyPage;
