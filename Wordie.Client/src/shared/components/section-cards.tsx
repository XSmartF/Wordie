import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import type { DashboardSummary } from "@/features/dashboard/types"
import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

interface SectionCardsProps {
  summary: DashboardSummary
}

function formatNumber(value: number) {
  return value.toLocaleString()
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function SectionCards({ summary }: SectionCardsProps) {
  const cards = [
    {
      title: "Total Words",
      value: formatNumber(summary.totalWords),
      delta: summary.wordsMonthlyChangePercent,
      description: `${formatNumber(summary.wordsAddedLast30Days)} new words in the last 30 days`,
    },
    {
      title: "Word Sets",
      value: formatNumber(summary.totalWordSets),
      delta: summary.wordSetsMonthlyChangePercent,
      description: `${formatNumber(summary.wordSetsCreatedLast30Days)} new sets this month`,
    },
    {
      title: "Active Word Sets",
      value: formatNumber(summary.activeWordSetsLast30Days),
      delta: summary.activeWordSetsChangePercent,
      description: "Active sets with recent practice",
    },
    {
      title: "Words per Set",
      value: summary.averageWordsPerSet.toFixed(1),
      delta: null,
      description: "Average words across your sets",
    },
  ] as const

  return (
  <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => {
        const showDelta = card.delta !== null && card.delta !== undefined
        const isPositive = (card.delta ?? 0) >= 0

        return (
          <Card key={card.title} className="@container/card">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              {showDelta && (
                <CardAction>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {isPositive ? (
                      <IconTrendingUp className="size-4" />
                    ) : (
                      <IconTrendingDown className="size-4" />
                    )}
                    {formatPercent(card.delta!)}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-2 text-muted-foreground">
                {card.description}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
