import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import type { DashboardSummary } from "@/features/dashboard/types"
import { Badge } from "@/shared/components/ui/badge"
import { PageSection } from "@/shared/components/page"
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
    <PageSection>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const showDelta = card.delta !== null && card.delta !== undefined
          const isPositive = (card.delta ?? 0) >= 0

          return (
            <Card key={card.title} className="@container/card">
              <CardHeader>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.08em] text-indigo-500/80">
                  {card.title}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums text-gray-900 @[250px]/card:text-4xl dark:text-slate-100">
                  {card.value}
                </CardTitle>
                {showDelta && (
                  <CardAction>
                    <Badge
                      variant="outline"
                      className="border-transparent bg-indigo-50 text-indigo-600 shadow-none dark:bg-indigo-500/20 dark:text-indigo-200"
                    >
                      <span className="inline-flex items-center gap-1 font-medium">
                        {isPositive ? (
                          <IconTrendingUp className="size-4" />
                        ) : (
                          <IconTrendingDown className="size-4" />
                        )}
                        {formatPercent(card.delta!)}
                      </span>
                    </Badge>
                  </CardAction>
                )}
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
                <div className="line-clamp-2">
                  {card.description}
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </PageSection>
  )
}
