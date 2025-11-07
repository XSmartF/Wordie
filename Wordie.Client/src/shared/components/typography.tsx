import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-bold tracking-tight md:text-5xl",
  h2: "scroll-m-20 text-2xl font-semibold tracking-tight md:text-3xl",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      subtitle: "text-lg font-medium text-muted-foreground",
      lead: "text-lg text-muted-foreground",
      body: "text-base leading-relaxed",
      muted: "text-sm text-muted-foreground",
      small: "text-sm font-medium",
      caption: "text-xs uppercase tracking-wider text-muted-foreground",
      eyebrow: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    variant: "body",
    weight: "regular",
  },
})

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>["variant"]>

const variantDefaultElement: Record<TypographyVariant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  subtitle: "h3",
  lead: "p",
  body: "p",
  muted: "p",
  small: "p",
  caption: "span",
  eyebrow: "span",
}

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  asChild?: boolean
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ variant, weight, className, asChild = false, children, ...props }, ref) => {
    const Comp = (asChild ? Slot : variantDefaultElement[variant ?? "body"] ?? "p") as React.ElementType

    return (
      <Comp
        ref={ref}
        className={cn(typographyVariants({ variant, weight }), className)}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Typography.displayName = "Typography"

function createTypographyVariant(variant: TypographyVariant) {
  return React.forwardRef<HTMLElement, Omit<TypographyProps, "variant">>(
    ({ className, ...props }, ref) => (
      <Typography ref={ref} variant={variant} className={className} {...props} />
    )
  )
}

const TypographyH1 = createTypographyVariant("h1")
TypographyH1.displayName = "TypographyH1"

const TypographyH2 = createTypographyVariant("h2")
TypographyH2.displayName = "TypographyH2"

const TypographyH3 = createTypographyVariant("h3")
TypographyH3.displayName = "TypographyH3"

const TypographyH4 = createTypographyVariant("h4")
TypographyH4.displayName = "TypographyH4"

const TypographyLead = createTypographyVariant("lead")
TypographyLead.displayName = "TypographyLead"

const TypographyMuted = createTypographyVariant("muted")
TypographyMuted.displayName = "TypographyMuted"

const TypographyCaption = createTypographyVariant("caption")
TypographyCaption.displayName = "TypographyCaption"

export {
  Typography,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyLead,
  TypographyMuted,
  TypographyCaption,
}
