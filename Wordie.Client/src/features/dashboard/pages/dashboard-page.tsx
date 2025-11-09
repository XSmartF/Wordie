import { useDashboardOverviewQuery } from "@/features/dashboard/hooks/use-dashboard-overview";
import { extractErrorMessage } from "@/shared/api/http-client";
import { PageSection, PageShell } from "@/shared/components/page";
import { ChartAreaInteractive } from "@/shared/components/chart-area-interactive";
import { SectionCards } from "@/shared/components/section-cards";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { Skeleton } from "@/shared/components/ui/skeleton";

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
    </PageShell>
  );
}

export const DashboardPage = () => {
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useDashboardOverviewQuery();

  const showInitialSkeleton = !data && isLoading;
  const hasErrorWithoutData = !!error && !data;

  if (showInitialSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <PageShell>
      

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
        </>
      )}
    </PageShell>
  );
};

export default DashboardPage;
