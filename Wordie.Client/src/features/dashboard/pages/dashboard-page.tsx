import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { IconRefresh } from "@tabler/icons-react";
import { format, formatDistanceToNow } from "date-fns";

import { useDashboardOverviewQuery } from "@/features/dashboard/hooks/use-dashboard-overview";
import type { DashboardWordSetSummary } from "@/features/dashboard/types";
import { extractErrorMessage } from "@/shared/api/http-client";
import { PageHeader, PageSection, PageShell } from "@/shared/components/page";
import { ChartAreaInteractive } from "@/shared/components/chart-area-interactive";
import { DataTable } from "@/shared/components/data-table";
import { SectionCards } from "@/shared/components/section-cards";
import { Button } from "@/shared/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { Skeleton } from "@/shared/components/ui/skeleton";

export type DashboardTableRow = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
  wordSetId: string;
  description?: string;
  wordCount: number;
  createdAt: string;
  lastWordAddedAt?: string;
};

function DashboardSkeleton() {
  return (
    <PageShell>
      <PageSection>
        <Skeleton className="h-6 w-40" />
      </PageSection>
      <PageSection className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </PageSection>
      <PageSection>
        <Skeleton className="h-[260px] w-full" />
      </PageSection>
      <PageSection>
        <Skeleton className="h-[360px] w-full" />
      </PageSection>
    </PageShell>
  );
}

export const DashboardPage = () => {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDashboardOverviewQuery();

  const columns = useMemo<ColumnDef<DashboardTableRow>[]>(
    () => [
      {
        accessorKey: "header",
        header: "Word Set",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.original.header}
            </span>
            {row.original.description ? (
              <span className="text-muted-foreground text-xs">
                {row.original.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "wordCount",
        header: "Words",
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {row.original.wordCount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), "MMM d, yyyy"),
      },
      {
        accessorKey: "lastWordAddedAt",
        header: "Last Activity",
        cell: ({ row }) =>
          row.original.lastWordAddedAt
            ? formatDistanceToNow(new Date(row.original.lastWordAddedAt), {
                addSuffix: true,
              })
            : "No words yet",
      },
    ],
    [],
  );

  const tableRows = useMemo<DashboardTableRow[]>(() => {
    if (!data) {
      return [];
    }

    return mapWordSetsToRows(data.wordSets);
  }, [data]);

  const showInitialSkeleton = !data && isLoading;
  const hasErrorWithoutData = !!error && !data;

  if (showInitialSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        titleClassName="text-lg font-semibold"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-2"
            disabled={isFetching}
          >
            <IconRefresh className="size-4" />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {hasErrorWithoutData ? (
        <PageSection>
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>Unable to load dashboard</EmptyTitle>
              <EmptyDescription>{extractErrorMessage(error)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PageSection>
      ) : (
        <>
          {data ? <SectionCards summary={data.summary} /> : null}
          <PageSection>
            <ChartAreaInteractive
              series={data?.trends ?? []}
              isLoading={isFetching && !data}
            />
          </PageSection>
          <PageSection>
            <DataTable
              data={tableRows}
              columns={columns}
              enableTabs={false}
              enableDragAndDrop={false}
              selectable={false}
              loading={isFetching}
              searchableColumns={[]}
              filterableColumns={[]}
            />
          </PageSection>
        </>
      )}
    </PageShell>
  );
};

function mapWordSetsToRows(
  wordSets: DashboardWordSetSummary[],
): DashboardTableRow[] {
  return wordSets.map((set, index) => ({
    id: index + 1,
    header: set.title,
    type: set.description ?? "",
    status: set.wordCount > 0 ? "Active" : "Empty",
    target: "",
    limit: "",
    reviewer: "",
    wordSetId: set.id,
    description: set.description,
    wordCount: set.wordCount,
    createdAt: set.createdAt,
    lastWordAddedAt: set.lastWordAddedAt,
  }));
}

export default DashboardPage;
