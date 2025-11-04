import type { UserProfile } from "@/features/auth/types"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"

type SiteHeaderProps = {
  user?: UserProfile
  onSignOut?: () => void
}

export function SiteHeader({ user, onSignOut }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          <span className="text-base font-semibold">Dashboard</span>
          {user?.displayName || user?.userName ? (
            <span className="text-muted-foreground text-xs">
              Welcome back, {user.displayName || user.userName}!
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onSignOut ? (
            <Button variant="outline" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
