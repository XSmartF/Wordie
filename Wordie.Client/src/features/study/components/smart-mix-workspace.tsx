import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  STUDY_CARD_DIRECTION,
  STUDY_CARD_STATUS,
  STUDY_RATING,
  STUDY_SESSION_STATUS,
  type StudyAnswerResponse,
  type StudyCardDto,
  type StudyRating,
  type StudySessionDto,
} from "@/features/study/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Spinner } from "@/shared/components/ui/spinner";
import { Typography } from "@/shared/components/typography";
import { cn } from "@/lib/utils";

const SMART_BATCH_SIZE = 5;

type Phase = "intake" | "practice" | "completed";

type SmartMixVariant = "flashcard" | "multipleChoice" | "typing";

interface SmartMixWorkspaceProps {
  session: StudySessionDto;
  isSubmitting: boolean;
  onSubmitAsync: (payload: {
    rating: StudyRating;
    progressId: string;
    userAnswer?: string | null;
    selectedOptions?: string[] | null;
  }) => Promise<StudyAnswerResponse>;
  onFocusCard: () => void;
}

export function SmartMixWorkspace({ session, isSubmitting, onSubmitAsync, onFocusCard }: SmartMixWorkspaceProps) {
  const [phase, setPhase] = useState<Phase>("intake");
  const [triagedIds, setTriagedIds] = useState<Set<string>>(() => new Set());
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [variant, setVariant] = useState<SmartMixVariant>("flashcard");
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [currentBatchGoal, setCurrentBatchGoal] = useState(0);

  const lastActiveIdRef = useRef<string | null>(null);
  const lastTriageIdRef = useRef<string | null>(null);

  useEffect(() => {
    setPhase("intake");
    setTriagedIds(new Set());
    setBatchIds([]);
    setActiveId(null);
    setVariant("flashcard");
    setRevealed(false);
    setSelectedOption(null);
    setTypedAnswer("");
    setCurrentBatchGoal(0);
    lastActiveIdRef.current = null;
    lastTriageIdRef.current = null;
  }, [session.Id]);

  const cardMap = useMemo(() => {
    const map = new Map<string, StudyCardDto>();
    session.Queue.forEach((card) => {
      map.set(card.ProgressId, card);
    });
    return map;
  }, [session.Queue]);

  const availableCards = useMemo(
    () => session.Queue.filter((card) => card.Status !== STUDY_CARD_STATUS.Review),
    [session.Queue]
  );

  const triageCandidates = useMemo(() => {
    return availableCards
      .filter((card) => !triagedIds.has(card.ProgressId) && !batchIds.includes(card.ProgressId))
      .sort((a, b) => a.OrderIndex - b.OrderIndex);
  }, [availableCards, triagedIds, batchIds]);

  const currentTriageCard = phase === "intake" ? triageCandidates[0] ?? null : null;
  const activeCard = phase === "practice" && activeId ? cardMap.get(activeId) ?? null : null;

  useEffect(() => {
    setBatchIds((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter((id) => {
        const card = cardMap.get(id);
        return card && card.Status !== STUDY_CARD_STATUS.Review;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [cardMap]);

  useEffect(() => {
    if (session.Status === STUDY_SESSION_STATUS.Completed) {
      setPhase("completed");
      return;
    }

    if (phase === "intake") {
      if (batchIds.length >= SMART_BATCH_SIZE) {
        setPhase("practice");
        return;
      }
      if (!currentTriageCard && batchIds.length > 0 && triageCandidates.length === 0) {
        setPhase("practice");
        return;
      }
      if (!currentTriageCard && batchIds.length === 0 && triageCandidates.length === 0 && availableCards.length === 0) {
        setPhase("completed");
      }
    } else if (phase === "practice") {
      if (batchIds.length === 0) {
        if (triageCandidates.length > 0) {
          setPhase("intake");
          setCurrentBatchGoal(0);
        } else if (availableCards.length === 0) {
          setPhase("completed");
          setCurrentBatchGoal(0);
        } else {
          setPhase("intake");
          setCurrentBatchGoal(0);
        }
      }
    } else if (phase === "completed" && availableCards.length > 0) {
      setPhase("intake");
    }
  }, [
    availableCards.length,
    batchIds.length,
    currentTriageCard,
    phase,
    session.Status,
    triageCandidates.length,
  ]);

  useEffect(() => {
    if (phase === "practice") {
      if (batchIds.length > 0) {
        const nextId = batchIds[0];
        if (nextId !== activeId) {
          setActiveId(nextId);
        }
        if (currentBatchGoal === 0) {
          setCurrentBatchGoal(batchIds.length);
        }
      } else {
        setActiveId(null);
      }
    } else {
      setActiveId(null);
      if (phase === "intake" && batchIds.length === 0 && currentBatchGoal !== 0) {
        setCurrentBatchGoal(0);
      }
    }
  }, [batchIds, currentBatchGoal, phase, activeId]);

  useEffect(() => {
    if (phase === "intake" && currentTriageCard) {
      if (lastTriageIdRef.current !== currentTriageCard.ProgressId) {
        lastTriageIdRef.current = currentTriageCard.ProgressId;
        onFocusCard();
      }
    } else if (phase !== "intake") {
      lastTriageIdRef.current = null;
    }
  }, [currentTriageCard, phase, onFocusCard]);

  useEffect(() => {
    if (activeCard && activeCard.ProgressId !== lastActiveIdRef.current) {
      lastActiveIdRef.current = activeCard.ProgressId;
      setVariant(selectVariant(activeCard, session.Settings, variant));
      setRevealed(false);
      setSelectedOption(null);
      setTypedAnswer("");
      onFocusCard();
    }
    if (!activeCard) {
      lastActiveIdRef.current = null;
    }
  }, [activeCard, onFocusCard, session.Settings, variant]);

  useEffect(() => {
    if (phase !== "practice") {
      setRevealed(false);
      setSelectedOption(null);
      setTypedAnswer("");
    }
  }, [phase]);

  const handleMarkKnown = useCallback(async () => {
    if (!currentTriageCard || isSubmitting) return;

    try {
      await onSubmitAsync({
        rating: STUDY_RATING.Easy,
        progressId: currentTriageCard.ProgressId,
        userAnswer: currentTriageCard.ExpectedAnswer,
      });

      setTriagedIds((prev) => {
        if (prev.has(currentTriageCard.ProgressId)) return prev;
        const next = new Set(prev);
        next.add(currentTriageCard.ProgressId);
        return next;
      });
    } catch (error) {
      console.error(error);
    }
  }, [currentTriageCard, isSubmitting, onSubmitAsync]);

  const handleMarkUnknown = useCallback(() => {
    if (!currentTriageCard || isSubmitting) return;

    setTriagedIds((prev) => {
      if (prev.has(currentTriageCard.ProgressId)) return prev;
      const next = new Set(prev);
      next.add(currentTriageCard.ProgressId);
      return next;
    });

    setBatchIds((prev) => {
      if (prev.includes(currentTriageCard.ProgressId)) return prev;
      return [...prev, currentTriageCard.ProgressId];
    });
  }, [currentTriageCard, isSubmitting]);

  const handleToggleReveal = useCallback(() => {
    setRevealed((prev) => !prev);
  }, []);

  const handleSelectOption = useCallback((option: string) => {
    setSelectedOption(option);
  }, []);

  const handlePracticeSubmit = useCallback(
    async (rating: StudyRating) => {
      if (!activeCard || isSubmitting) return;

      const payload = {
        rating,
        progressId: activeCard.ProgressId,
        userAnswer:
          variant === "typing"
            ? typedAnswer
            : revealed
              ? activeCard.ExpectedAnswer
              : undefined,
        selectedOptions:
          variant === "multipleChoice" && selectedOption ? [selectedOption] : null,
      } as const;

      try {
        const response = await onSubmitAsync(payload);
        const updatedCard = response.Session.Queue.find(
          (card) => card.ProgressId === activeCard.ProgressId
        );

        setBatchIds((prev) => {
          const without = prev.filter((id) => id !== activeCard.ProgressId);
          if (updatedCard && updatedCard.Status !== STUDY_CARD_STATUS.Review) {
            return [...without, activeCard.ProgressId];
          }
          return without;
        });

        setRevealed(false);
        setSelectedOption(null);
        setTypedAnswer("");
      } catch (error) {
        console.error(error);
      }
    },
    [activeCard, isSubmitting, onSubmitAsync, revealed, selectedOption, typedAnswer, variant]
  );

  const batchCards = useMemo(
    () => batchIds.map((id) => cardMap.get(id)).filter((card): card is StudyCardDto => Boolean(card)),
    [batchIds, cardMap]
  );

  const phaseLabel = getPhaseLabel(phase);
  const directionLabel = renderDirectionLabelLocal(session.Settings.Direction);
  const triagedCount = triagedIds.size;
  const totalCards = session.Stats.TotalCards;
  const rememberedInBatch = currentBatchGoal > 0 ? currentBatchGoal - batchIds.length : 0;

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Smart mix</Badge>
          <Badge variant="outline">{directionLabel}</Badge>
          <Badge variant="secondary">{phaseLabel}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Stat label="Đã hoàn thành" value={`${session.Stats.CompletedCards}/${totalCards}`} />
          <Stat
            label="Đang luyện"
            value={
              currentBatchGoal > 0
                ? `${rememberedInBatch}/${currentBatchGoal}`
                : `${batchIds.length}/${SMART_BATCH_SIZE}`
            }
          />
          <Stat label="Còn lại" value={Math.max(availableCards.length - batchIds.length, 0)} />
        </div>
      </header>

      <Separator />

      {phase === "intake" ? (
        <IntakeView
          card={currentTriageCard}
          batchCount={batchIds.length}
          triagedCount={triagedCount}
          totalCards={totalCards}
          isSubmitting={isSubmitting}
          onMarkKnown={handleMarkKnown}
          onMarkUnknown={handleMarkUnknown}
        />
      ) : null}

      {phase === "practice" ? (
        <PracticeView
          card={activeCard}
          variant={variant}
          batchCards={batchCards}
          batchGoal={currentBatchGoal}
          isSubmitting={isSubmitting}
          remembered={rememberedInBatch}
          revealed={revealed}
          selectedOption={selectedOption}
          typedAnswer={typedAnswer}
          onToggleReveal={handleToggleReveal}
          onSelectOption={handleSelectOption}
          onTypedAnswerChange={setTypedAnswer}
          onSubmit={handlePracticeSubmit}
        />
      ) : null}

      {phase === "completed" ? (
        <CompletedView />
      ) : null}
    </div>
  );
}

interface IntakeViewProps {
  card: StudyCardDto | null;
  batchCount: number;
  triagedCount: number;
  totalCards: number;
  isSubmitting: boolean;
  onMarkKnown: () => void;
  onMarkUnknown: () => void;
}

function IntakeView({
  card,
  batchCount,
  triagedCount,
  totalCards,
  isSubmitting,
  onMarkKnown,
  onMarkUnknown,
}: IntakeViewProps) {
  if (!card) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <Spinner className="size-5" />
        <p>Đang chuẩn bị thẻ tiếp theo...</p>
      </div>
    );
  }

  const showingTermFirst = card.Direction === STUDY_CARD_DIRECTION.TermToDefinition;
  const primaryLabel = showingTermFirst ? "Từ vựng" : "Định nghĩa";
  const secondaryLabel = showingTermFirst ? "Định nghĩa" : "Từ vựng";
  const primaryValue = card.Prompt;
  const secondaryValue = card.ExpectedAnswer;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase text-muted-foreground">
            <span>{renderDirectionLabelLocal(card.Direction)}</span>
            <span>
              Thẻ {card.OrderIndex + 1}/{totalCards}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">{primaryLabel}</p>
            <p className="text-2xl font-semibold text-foreground">{primaryValue}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">{secondaryLabel}</p>
            <p className="text-base text-foreground">{secondaryValue}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Đã sàng lọc {triagedCount}/{totalCards}</Badge>
            <Badge variant="outline">Đã chọn {batchCount}/{SMART_BATCH_SIZE}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={onMarkKnown}
          disabled={isSubmitting}
          className="min-w-36"
        >
          Tôi đã biết từ này
        </Button>
        <Button
          onClick={onMarkUnknown}
          disabled={isSubmitting}
          className="min-w-36"
        >
          Thêm vào luyện ({batchCount}/{SMART_BATCH_SIZE})
        </Button>
      </div>

      <Typography variant="muted" className="text-sm">
        Chế độ Smart mix sẽ luyện ngẫu nhiên nhiều dạng câu hỏi cho tối đa {SMART_BATCH_SIZE} từ trong
        từng lượt. Hãy chọn các thẻ bạn cần ghi nhớ.
      </Typography>
    </div>
  );
}

interface PracticeViewProps {
  card: StudyCardDto | null;
  variant: SmartMixVariant;
  batchCards: StudyCardDto[];
  batchGoal: number;
  remembered: number;
  isSubmitting: boolean;
  revealed: boolean;
  selectedOption: string | null;
  typedAnswer: string;
  onToggleReveal: () => void;
  onSelectOption: (value: string) => void;
  onTypedAnswerChange: (value: string) => void;
  onSubmit: (rating: StudyRating) => void;
}

function PracticeView({
  card,
  variant,
  batchCards,
  batchGoal,
  remembered,
  isSubmitting,
  revealed,
  selectedOption,
  typedAnswer,
  onToggleReveal,
  onSelectOption,
  onTypedAnswerChange,
  onSubmit,
}: PracticeViewProps) {
  if (!card) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <Spinner className="size-5" />
        <p>Đang tải thẻ luyện tập...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-muted-foreground">
          <Badge variant="outline">{renderDirectionLabelLocal(card.Direction)}</Badge>
          <Badge variant="secondary">{variantLabel(variant)}</Badge>
        </div>
        {batchGoal > 0 ? (
          <Badge variant="outline">Đã nhớ {remembered}/{batchGoal}</Badge>
        ) : null}
      </div>

      <SmartMixCardView
        card={card}
        variant={variant}
        revealed={revealed}
        selectedOption={selectedOption}
        typedAnswer={typedAnswer}
        onToggleReveal={onToggleReveal}
        onSelectOption={onSelectOption}
        onTypedAnswerChange={onTypedAnswerChange}
        isSubmitting={isSubmitting}
      />

      {batchCards.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {batchCards.map((batchCard) => (
            <Badge
              key={batchCard.ProgressId}
              variant={batchCard.ProgressId === card.ProgressId ? "default" : "outline"}
              className="px-2 py-1"
            >
              {truncateLabel(batchCard.Prompt)}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="destructive"
          onClick={() => onSubmit(STUDY_RATING.Again)}
          disabled={isSubmitting}
        >
          Again
        </Button>
        <Button
          variant="secondary"
          onClick={() => onSubmit(STUDY_RATING.Hard)}
          disabled={isSubmitting}
        >
          Hard
        </Button>
        <Button
          variant="default"
          onClick={() => onSubmit(STUDY_RATING.Good)}
          disabled={isSubmitting}
        >
          Good
        </Button>
        <Button
          variant="default"
          className="bg-emerald-500 text-white hover:bg-emerald-500/90"
          onClick={() => onSubmit(STUDY_RATING.Easy)}
          disabled={isSubmitting}
        >
          Easy
        </Button>
      </div>
    </div>
  );
}

interface SmartMixCardViewProps {
  card: StudyCardDto;
  variant: SmartMixVariant;
  revealed: boolean;
  selectedOption: string | null;
  typedAnswer: string;
  onToggleReveal: () => void;
  onSelectOption: (value: string) => void;
  onTypedAnswerChange: (value: string) => void;
  isSubmitting: boolean;
}

function SmartMixCardView({
  card,
  variant,
  revealed,
  selectedOption,
  typedAnswer,
  onToggleReveal,
  onSelectOption,
  onTypedAnswerChange,
  isSubmitting,
}: SmartMixCardViewProps) {
  if (variant === "multipleChoice" && card.Options && card.Options.length > 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-6 text-center text-lg font-semibold text-foreground">
          {card.Prompt}
        </div>
        <div className="grid gap-3">
          {card.Options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = revealed && option === card.ExpectedAnswer;
            return (
              <Button
                key={option}
                type="button"
                variant={isSelected ? "secondary" : "outline"}
                className={cn(
                  "justify-start",
                  isCorrect && "border-green-500 text-green-700 dark:text-green-400"
                )}
                onClick={() => onSelectOption(option)}
                disabled={isSubmitting}
              >
                {option}
              </Button>
            );
          })}
        </div>
        <Button variant="ghost" onClick={onToggleReveal} disabled={isSubmitting}>
          {revealed ? "Ẩn đáp án" : "Hiện đáp án"}
        </Button>
      </div>
    );
  }

  if (variant === "typing") {
    const typedMatches = typedAnswer.trim().length > 0 &&
      typedAnswer.trim().toLowerCase() === card.ExpectedAnswer.trim().toLowerCase();

    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-6 text-center text-lg font-semibold text-foreground">
          {card.Prompt}
        </div>
        <Input
          value={typedAnswer}
          onChange={(event) => onTypedAnswerChange(event.target.value)}
          placeholder="Nhập câu trả lời của bạn"
          disabled={isSubmitting}
        />
        {typedMatches ? (
          <p className="text-sm font-medium text-emerald-600">Câu trả lời trùng khớp!</p>
        ) : null}
        {revealed ? (
          <p className="rounded-md bg-muted/40 p-3 text-sm">
            Đáp án: <strong>{card.ExpectedAnswer}</strong>
          </p>
        ) : null}
        <Button variant="ghost" onClick={onToggleReveal} disabled={isSubmitting}>
          {revealed ? "Ẩn đáp án" : "Hiện đáp án"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-xl cursor-pointer select-none border-dashed" onClick={onToggleReveal}>
        <CardContent className="flex h-48 items-center justify-center text-center text-xl font-semibold text-foreground">
          {revealed ? card.ExpectedAnswer : card.Prompt}
        </CardContent>
      </Card>
      <Button variant="outline" onClick={onToggleReveal} disabled={isSubmitting}>
        {revealed ? "Ẩn đáp án" : "Lật thẻ"}
      </Button>
    </div>
  );
}

function CompletedView() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-semibold text-foreground">🎉 Bạn đã hoàn thành lượt học này.</p>
      <p className="text-sm text-muted-foreground">
        Tiếp tục sàng lọc thêm từ hoặc quay lại bộ từ khác để luyện tập.
      </p>
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
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function selectVariant(
  card: StudyCardDto,
  settings: StudySessionDto["Settings"],
  previous: SmartMixVariant
): SmartMixVariant {
  const variants: SmartMixVariant[] = [];
  if (settings.AllowFlip) variants.push("flashcard");
  if (settings.AllowTyping) variants.push("typing");
  if (card.Options && card.Options.length > 1) variants.push("multipleChoice");

  if (variants.length === 0) {
    return "flashcard";
  }

  if (variants.length === 1) {
    return variants[0];
  }

  const filtered = variants.filter((option) => option !== previous);
  const pool = filtered.length > 0 ? filtered : variants;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function renderDirectionLabelLocal(direction?: number) {
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

function getPhaseLabel(phase: Phase) {
  switch (phase) {
    case "intake":
      return "Khởi động";
    case "practice":
      return "Luyện tập";
    case "completed":
      return "Hoàn tất";
    default:
      return "Smart mix";
  }
}

function variantLabel(variant: SmartMixVariant) {
  switch (variant) {
    case "flashcard":
      return "Flashcard";
    case "multipleChoice":
      return "Multiple choice";
    case "typing":
      return "Typing";
    default:
      return "Card";
  }
}

function truncateLabel(value: string, length = 28) {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length - 1)}…`;
}
