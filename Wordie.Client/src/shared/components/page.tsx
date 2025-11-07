import * as React from "react";

import { Typography } from "@/shared/components/typography";
import { cn } from "@/shared/lib/utils";

export type PageShellProps = React.HTMLAttributes<HTMLDivElement>;

export function PageShell({ className, ...props }: PageShellProps) {
  return <div className={cn("page-shell", className)} {...props} />;
}

export type PageSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function PageSection({ className, ...props }: PageSectionProps) {
  return <section className={cn("page-section", className)} {...props} />;
}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  titleClassName?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  ...props
}: PageHeaderProps) {
  const renderedTitle = React.isValidElement(title) ? (
    title
  ) : (
    <Typography variant="h2" className={titleClassName}>
      {title}
    </Typography>
  );

  const renderedDescription = React.isValidElement(description)
    ? description
    : description != null
      ? (
          <Typography variant="muted">{description}</Typography>
        )
      : null;

  return (
    <PageSection
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {renderedTitle}
        {renderedDescription}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 md:gap-4">{actions}</div>
      ) : null}
    </PageSection>
  );
}
