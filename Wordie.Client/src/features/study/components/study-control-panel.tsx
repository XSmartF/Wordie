import { type Dispatch, type SetStateAction, useMemo } from "react";
import {
  type StartStudySessionRequest,
  type StudyCardDirection,
  STUDY_CARD_DIRECTION,
  STUDY_MODE,
} from "@/features/study/types";
import type { WordSetDto, WordDto } from "@/features/word-sets/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { ComboBox } from "@/shared/components/combobox";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Typography } from "@/shared/components/typography";

interface StudyControlPanelProps {
  isLoading: boolean;
  wordSet: WordSetDto | null;
  settings: StartStudySessionRequest;
  availableWords: WordDto[];
  onChangeSettings: Dispatch<SetStateAction<StartStudySessionRequest>>;
}

export function StudyControlPanel({
  isLoading,
  wordSet,
  settings,
  availableWords,
  onChangeSettings,
}: StudyControlPanelProps) {
  const totalWords = availableWords.length;
  const dueCount = useMemo(
    () =>
      availableWords.filter((word) => {
        if (!word.DueAt) return true;
        return new Date(word.DueAt) <= new Date();
      }).length,
    [availableWords]
  );

  const newCount = useMemo(
    () => availableWords.filter((word) => !word.LastReviewedAt).length,
    [availableWords]
  );

  const directionOptions = useMemo(
    () => [
      {
        value: String(STUDY_CARD_DIRECTION.TermToDefinition),
        label: "Thuật ngữ → Định nghĩa",
      },
      {
        value: String(STUDY_CARD_DIRECTION.DefinitionToTerm),
        label: "Định nghĩa → Thuật ngữ",
      },
      {
        value: String(STUDY_CARD_DIRECTION.Mixed),
        label: "Trộn ngẫu nhiên",
      },
    ],
    []
  );

  const directionValue = String(
    settings.Direction ?? STUDY_CARD_DIRECTION.TermToDefinition
  );

  const isSmartMixMode = settings.Mode === STUDY_MODE.SmartMix;

  const handleUpdate = <Key extends keyof StartStudySessionRequest>(
    key: Key,
    value: StartStudySessionRequest[Key]
  ) => {
    onChangeSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Typography variant="muted">Đang tải dữ liệu...</Typography>
      </div>
    );
  }

  if (!wordSet) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
        <Typography className="text-lg font-semibold">
          Chưa chọn bộ từ vựng
        </Typography>
        <Typography variant="muted">
          Hãy chọn một bộ từ để xem thống kê và thiết lập.
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{wordSet.Title}</CardTitle>
          <CardDescription>{wordSet.Description ?? ""}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <Typography variant="muted">Tổng thẻ</Typography>
            <Typography className="text-lg font-semibold">{totalWords}</Typography>
          </div>
          <div>
            <Typography variant="muted">Đang đến hạn</Typography>
            <Typography className="text-lg font-semibold">{dueCount}</Typography>
          </div>
          <div>
            <Typography variant="muted">Thẻ mới</Typography>
            <Typography className="text-lg font-semibold">{newCount}</Typography>
          </div>
          <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline">Spaced repetition</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Lịch ôn tập được tối ưu bằng thuật toán lặp lại ngắt quãng.
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline">Quizlet modes</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Các chế độ luyện tập quen thuộc như flashcard và kiểm tra nhanh.
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

        {isSmartMixMode ? (
          <Card>
            <CardHeader>
              <CardTitle>Smart mix</CardTitle>
              <CardDescription>
                Hệ thống sẽ hỏi bạn về việc đã biết từ nào trước khi luyện tập hỗn hợp nhiều dạng câu hỏi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Quy trình: sàng lọc nhanh tối đa 5 từ chưa chắc chắn, sau đó luân phiên flashcard, trắc nghiệm và nhập liệu
                cho đến khi ghi nhớ, rồi chuyển sang nhóm kế tiếp.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Tiết kiệm thời gian bằng bước xác nhận "đã biết" hoặc "cần học".</li>
                <li>Tăng cường ghi nhớ nhờ tự động đổi dạng câu hỏi mỗi lượt.</li>
                <li>Theo dõi tiến độ từng nhóm để biết đã nắm vững bao nhiêu từ.</li>
              </ul>
            </CardContent>
          </Card>
        ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Thiết lập phiên học</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-limit">Số lượng thẻ</Label>
              <Input
                id="session-limit"
                type="number"
                min={1}
                max={200}
                value={settings.Limit ?? 20}
                onChange={(event) => handleUpdate("Limit", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Hướng thẻ</Label>
              <ComboBox
                items={directionOptions}
                value={directionValue}
                onChange={(nextValue) => {
                  if (!nextValue) return;
                  handleUpdate(
                    "Direction",
                    Number(nextValue) as StudyCardDirection
                  );
                }}
                placeholder="Chọn hướng thẻ"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ToggleSwitch
              label="Bao gồm thẻ đến hạn"
              checked={settings.IncludeDue ?? true}
              onCheckedChange={(value) => handleUpdate("IncludeDue", value)}
            />
            <ToggleSwitch
              label="Bao gồm thẻ mới"
              checked={settings.IncludeNew ?? true}
              onCheckedChange={(value) => handleUpdate("IncludeNew", value)}
            />
            <ToggleSwitch
              label="Trộn ngẫu nhiên"
              checked={settings.Shuffle ?? true}
              onCheckedChange={(value) => handleUpdate("Shuffle", value)}
            />
            <ToggleSwitch
              label="Cho phép lật thẻ"
              checked={settings.AllowFlip ?? true}
              onCheckedChange={(value) => handleUpdate("AllowFlip", value)}
            />
            <ToggleSwitch
              label="Cho phép nhập câu trả lời"
              checked={settings.AllowTyping ?? true}
              onCheckedChange={(value) => handleUpdate("AllowTyping", value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

function ToggleSwitch({ label, checked, onCheckedChange }: ToggleSwitchProps) {
  return (
    <Label className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}
