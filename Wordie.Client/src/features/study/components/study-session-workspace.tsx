import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { studyApi } from "@/features/study/api/study-api";
import {
  type StartStudySessionRequest,
  type StudyCardDto,
  type StudyAnswerResponse,
  type StudySessionDto,
  type StudyRating,
  STUDY_MODE,
  STUDY_RATING,
  STUDY_CARD_DIRECTION,
  STUDY_CARD_STATUS,
  STUDY_SESSION_STATUS,
} from "@/features/study/types";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Spinner } from "@/shared/components/ui/spinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudySessionWorkspaceProps {
  sessionId: string | null;
  settings: StartStudySessionRequest;
}

export function StudySessionWorkspace({ sessionId, settings }: StudySessionWorkspaceProps) {
  const queryClient = useQueryClient();
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const cardStartTime = useRef<number | null>(null);

  const sessionQuery = useQuery<StudySessionDto>({
    queryKey: ["study", "sessions", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("Missing session id");
      }
      const session = await studyApi.getSession(sessionId);
      return session;
    },
    enabled: Boolean(sessionId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const currentCard = useMemo<StudyCardDto | null>(() => {
    if (!sessionQuery.data) return null;
    if (sessionQuery.data.CurrentCard) return sessionQuery.data.CurrentCard;
    return sessionQuery.data.Queue.find((card) => card.Status !== STUDY_CARD_STATUS.Review) ?? null;
  }, [sessionQuery.data]);

  useEffect(() => {
    if (!currentCard) {
      setRevealed(false);
      setSelectedOption(null);
      setTypedAnswer("");
      return;
    }
    cardStartTime.current = Date.now();
    setRevealed(false);
    setSelectedOption(null);
    setTypedAnswer("");
  }, [currentCard]);

  const updateSessionCache = useCallback(
    (session: StudySessionDto) => {
      if (!sessionId) return;
      queryClient.setQueryData<StudySessionDto>(["study", "sessions", sessionId], session);
    },
    [queryClient, sessionId]
  );

  type SubmitPayload = {
    rating: StudyRating;
    userAnswer?: string | null;
    selected?: string[] | null;
  };

  const submitMutation = useMutation<StudyAnswerResponse, unknown, SubmitPayload>({
    mutationFn: async ({ rating, userAnswer, selected }: SubmitPayload) => {
      if (!sessionId || !currentCard) {
        throw new Error("Không tìm thấy thẻ hiện tại");
      }
      const startedAt = cardStartTime.current ?? Date.now();
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

      return await studyApi.submitAnswer(sessionId, {
        ProgressId: currentCard.ProgressId,
        Rating: rating,
        TimeSpentSeconds: elapsedSeconds,
        UserAnswer: userAnswer ?? null,
        SelectedOptions: selected ?? null,
      });
    },
    onSuccess: (data: StudyAnswerResponse) => {
      updateSessionCache(data.Session);
      if (data.NextCard) {
        toast.success("Tiếp tục với thẻ tiếp theo");
      } else if (data.Session.Status === STUDY_SESSION_STATUS.Completed) {
        toast.success("Hoàn thành phiên học 🎉");
      }
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error("Không thể ghi nhận kết quả, vui lòng thử lại");
    },
  });

  const handleReveal = () => setRevealed((prev) => !prev);

  const handleSubmitRating = useCallback(
    (rating: StudyRating) => {
      if (!currentCard || submitMutation.isPending) return;

      const answerPayload = {
        rating,
        userAnswer: typedAnswer || (revealed ? currentCard.ExpectedAnswer : undefined),
        selected: selectedOption ? [selectedOption] : null,
      };

      submitMutation.mutate(answerPayload);
    },
    [currentCard, selectedOption, submitMutation, typedAnswer, revealed]
  );

  const renderPrompt = () => {
    if (!currentCard) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <p>Chưa có thẻ để học. Hãy bắt đầu hoặc chọn lại bộ từ.</p>
        </div>
      );
    }

    const mode = sessionQuery.data?.Settings.Mode ?? settings.Mode;

    if (mode === STUDY_MODE.MultipleChoice && currentCard.Options) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-6 text-center text-lg font-semibold">
            {currentCard.Prompt}
          </div>
          <div className="grid gap-3">
            {currentCard.Options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = revealed && option === currentCard.ExpectedAnswer;

              return (
                <Button
                  key={option}
                  type="button"
                  variant={isSelected ? "secondary" : "outline"}
                  className={cn(
                    "justify-start",
                    isCorrect && "border-green-500 text-green-700 dark:text-green-400"
                  )}
                  onClick={() => setSelectedOption(option)}
                  disabled={submitMutation.isPending}
                >
                  {option}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={handleReveal}
            disabled={submitMutation.isPending}
          >
            {revealed ? "Ẩn đáp án" : "Hiện đáp án"}
          </Button>
        </div>
      );
    }

    if (mode === STUDY_MODE.Typing) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-6 text-center text-lg font-semibold">
            {currentCard.Prompt}
          </div>
          <Input
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            placeholder="Nhập câu trả lời của bạn"
            disabled={submitMutation.isPending}
          />
          {revealed && (
            <p className="rounded-md bg-muted/40 p-3 text-sm">
              Đáp án: <strong>{currentCard.ExpectedAnswer}</strong>
            </p>
          )}
          <Button
            variant="outline"
            onClick={handleReveal}
            disabled={submitMutation.isPending}
          >
            {revealed ? "Ẩn đáp án" : "Hiện đáp án"}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Card className="w-full max-w-xl cursor-pointer select-none border-dashed" onClick={handleReveal}>
          <CardContent className="flex h-48 items-center justify-center text-center text-xl font-semibold">
            {revealed ? currentCard.ExpectedAnswer : currentCard.Prompt}
          </CardContent>
        </Card>
        <Button variant="outline" onClick={handleReveal} disabled={submitMutation.isPending}>
          {revealed ? "Ẩn đáp án" : "Lật thẻ"}
        </Button>
      </div>
    );
  };

  const renderControls = () => {
    if (!currentCard) {
      if (sessionQuery.data?.Status === STUDY_SESSION_STATUS.Completed) {
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-lg font-semibold">🎉 Bạn đã hoàn thành phiên học này.</p>
            <p className="text-muted-foreground">Khởi tạo phiên mới để tiếp tục luyện tập.</p>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="destructive"
          onClick={() => handleSubmitRating(STUDY_RATING.Again)}
          disabled={submitMutation.isPending}
        >
          Again
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmitRating(STUDY_RATING.Hard)}
          disabled={submitMutation.isPending}
        >
          Hard
        </Button>
        <Button
          variant="default"
          onClick={() => handleSubmitRating(STUDY_RATING.Good)}
          disabled={submitMutation.isPending}
        >
          Good
        </Button>
        <Button
          variant="default"
          className="bg-emerald-500 text-white hover:bg-emerald-500/90"
          onClick={() => handleSubmitRating(STUDY_RATING.Easy)}
          disabled={submitMutation.isPending}
        >
          Easy
        </Button>
      </div>
    );
  };

  if (!sessionId) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <p>Chọn bộ từ và nhấn "Bắt đầu học" để khởi tạo phiên mới.</p>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="font-semibold text-destructive">Không thể tải phiên học.</p>
        <p className="text-sm text-muted-foreground">Vui lòng thử bắt đầu lại phiên mới.</p>
      </div>
    );
  }

  const session = sessionQuery.data;
  const modeLabel = mapModeToLabel(session?.Settings.Mode ?? settings.Mode);

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{modeLabel}</Badge>
          <Badge variant="outline">{renderDirectionLabel(session?.Settings.Direction)}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Stat label="Đã hoàn thành" value={`${session?.Stats.CompletedCards}/${session?.Stats.TotalCards}`} />
          <Stat label="Đúng" value={session?.Stats.CorrectAnswers ?? 0} />
          <Stat label="Sai" value={session?.Stats.IncorrectAnswers ?? 0} />
        </div>
      </header>

      <Separator />

      {renderPrompt()}

      {renderControls()}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="text-right">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function mapModeToLabel(mode: number) {
  switch (mode) {
    case STUDY_MODE.Flashcard:
      return "Flashcard";
    case STUDY_MODE.MultipleChoice:
      return "Multiple choice";
    case STUDY_MODE.Typing:
      return "Typing";
    default:
      return "Study";
  }
}

function renderDirectionLabel(direction?: number) {
  if (!direction) return "";
  switch (direction) {
    case STUDY_CARD_DIRECTION.TermToDefinition:
      return "Thuật ngữ → Định nghĩa";
    case STUDY_CARD_DIRECTION.DefinitionToTerm:
      return "Định nghĩa → Thuật ngữ";
    case STUDY_CARD_DIRECTION.Mixed:
      return "Trộn";
    default:
      return "";
  }
}
