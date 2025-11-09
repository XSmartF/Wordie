import { IconPlayerPlay } from "@tabler/icons-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Typography } from "@/shared/components/typography";
import type { WordSetDto } from "@/features/word-sets/types";
import { format } from "date-fns";
import { cn } from "@/shared/lib/utils";

export interface WordSetCardProps {
  wordSet: WordSetDto;
  onClick?: () => void;
  onToggleFavorite?: (nextState: boolean) => void;
  onStudy?: () => void;
  footer?: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function WordSetCard({
  wordSet,
  onClick,
  onStudy,
  footer,
  className,
  highlight = false,
}: WordSetCardProps) {
  const createdLabel = format(new Date(wordSet.CreatedAt), "dd/MM/yyyy");

  return (
    <Card
      className={cn(
        "flex h-full flex-col border border-border/80 shadow-sm transition hover:border-primary/50",
        highlight ? "ring-2 ring-primary/60" : "",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-start justify-between gap-3 text-lg">
          <button
            type="button"
            onClick={onClick}
            className="flex-1 text-left text-foreground transition hover:text-primary"
          >
            <span className="line-clamp-2 leading-tight">{wordSet.Title}</span>
          </button>
        </CardTitle>
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {wordSet.Description || "Chưa có mô tả."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[0.7rem] uppercase tracking-wide">
            #{wordSet.Id.slice(0, 8)}
          </Badge>
          <span>Ngày tạo • {createdLabel}</span>
        </div>

        <div className="grid gap-3 rounded-lg border border-dashed p-3">
          <div className="flex justify-between text-sm">
            <Typography variant="muted">Tổng số từ</Typography>
            <Typography className="font-medium text-foreground">
              {wordSet.WordCount?.toLocaleString() ?? "—"}
            </Typography>
          </div>
          <div className="flex justify-between text-sm">
            <Typography variant="muted">Từ đã luyện tập</Typography>
            <Typography className="font-medium text-foreground">
              {wordSet.ReviewedCount?.toLocaleString() ?? "—"}
            </Typography>
          </div>
          <div className="flex justify-between text-sm">
            <Typography variant="muted">Tỷ lệ đúng</Typography>
            <Typography className="font-medium text-foreground">
              {typeof wordSet.CorrectRate === "number"
                ? `${Math.round(wordSet.CorrectRate * 100)}%`
                : "—"}
            </Typography>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="gap-2" onClick={onStudy}>
          <IconPlayerPlay className="size-4" /> Học ngay
        </Button>
        {footer}
      </CardFooter>
    </Card>
  );
}
