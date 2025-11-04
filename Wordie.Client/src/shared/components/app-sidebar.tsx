import { type ComponentProps } from "react"
import {
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconStar,
} from "@tabler/icons-react"
import { Link } from "react-router-dom"

import type { UserProfile } from "@/features/auth/types"
import { useWordSetFavoritesQuery } from "@/features/word-sets/hooks/use-word-set-favorites"

import { NavMain } from "@/shared/components/nav-main"
import { NavSecondary } from "@/shared/components/nav-secondary"
import { NavUser } from "@/shared/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconDashboard,
  },
  {
    title: "Word Sets",
    url: "/wordsets",
    icon: IconListDetails,
  },
  {
    title: "Study",
    url: "/study",
    icon: IconReport,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch,
  },
]

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  user?: Pick<UserProfile, "email" | "displayName" | "userName">;
  onLogout?: () => void;
  isUserLoading?: boolean;
};

export function AppSidebar({ user, onLogout, isUserLoading, ...props }: AppSidebarProps) {
  const {
    data: favorites = [],
    isLoading: favoritesLoading,
    isError: favoritesError,
  } = useWordSetFavoritesQuery();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              asChild
            >
              <Link to="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Wordie</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <SidebarMenu>
          <div className="px-3 pt-2 text-xs font-semibold text-muted-foreground">
            Favorites
          </div>
          {favoritesLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading…</div>
          ) : favoritesError ? (
            <div className="px-3 py-2 text-sm text-destructive">
              Unable to load favorites
            </div>
          ) : favorites.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No favorites</div>
          ) : (
            favorites.map((f) => (
              <SidebarMenuItem key={f.Id}>
                <SidebarMenuButton asChild>
                  <Link to={`/wordsets/${f.Id}`} className="flex items-center gap-2">
                    <IconStar className="size-4 text-yellow-500" />
                    <span className="truncate">{f.Title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user
              ? {
                  name: user.displayName || user.userName,
                  email: user.email,
                }
              : undefined
          }
          isLoading={isUserLoading}
          onLogout={onLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
