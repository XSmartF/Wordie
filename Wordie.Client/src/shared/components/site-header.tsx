import type { UserProfile } from "@/features/auth/types"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"

type SiteHeaderProps = {
  user?: UserProfile
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="relative flex h-(--header-height) shrink-0 items-center gap-2 border-b border-indigo-100/60 bg-white/80 px-4 shadow-sm backdrop-blur-lg transition-[width,height] duration-300 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) dark:border-white/5 dark:bg-slate-900/80 lg:px-6">
      <div className="flex w-full items-center gap-2 lg:gap-3">
        <SidebarTrigger className="-ml-1 text-indigo-500 hover:text-indigo-600" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 bg-indigo-100/80 dark:bg-indigo-500/30"
        />
        <div className="flex flex-col">
          <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
            Dashboard
          </span>
          {user?.displayName || user?.userName ? (
            <span className="text-xs text-indigo-600/80 dark:text-indigo-200/80">
              Welcome back, {user.displayName || user.userName}!
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
        </div>
      </div>
    </header>
  )
}
