"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/shared/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import type { ChartConfig } from "@/shared/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/components/ui/toggle-group"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/components/ui/empty"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { DashboardTrendPoint } from "@/types"

const chartConfig = {
  words: {
    label: "Words",
    color: "var(--primary)",
  },
  wordSets: {
    label: "Word Sets",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  series: DashboardTrendPoint[]
  isLoading?: boolean
}

export function ChartAreaInteractive({ series, isLoading = false }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const sortedSeries = React.useMemo(() => {
    return [...series].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [series])

  const filteredData = React.useMemo(() => {
    if (!sortedSeries.length) return []

    const latest = new Date(sortedSeries[sortedSeries.length - 1].date)
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const startDate = new Date(latest)
    startDate.setDate(latest.getDate() - (days - 1))

    return sortedSeries.filter((point) => {
      const pointDate = new Date(point.date)
      return pointDate >= startDate
    })
  }, [sortedSeries, timeRange])

  const chartData = React.useMemo(
    () =>
      filteredData.map((point) => ({
        date: point.date,
        words: point.words,
        wordSets: point.wordSets,
      })),
    [filteredData]
  )

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>Loading activity data…</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>No activity recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No words tracked yet</EmptyTitle>
              <EmptyDescription>
                Start adding words or creating word sets to see your learning trends.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Learning Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Tracking words added and word sets created
          </span>
          <span className="@[540px]/card:hidden">Recent activity</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 90 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillWords" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-words)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-words)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillWordSets" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-wordSets)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-wordSets)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="wordSets"
              type="natural"
              fill="url(#fillWordSets)"
              stroke="var(--color-wordSets)"
              stackId="a"
            />
            <Area
              dataKey="words"
              type="natural"
              fill="url(#fillWords)"
              stroke="var(--color-words)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
