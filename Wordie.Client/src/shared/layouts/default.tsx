import { Suspense, useCallback } from "react"
import type { CSSProperties } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user"
import { AppSidebar } from "@/shared/components/app-sidebar"
import { SiteHeader } from "@/shared/components/site-header"
import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"
import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/components/ui/sidebar"

export default function DefaultLayout() {
  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties

  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { isAuthenticated, logout } = useAuth()
  const {
    data: currentUser,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser,
    isFetching: userFetching,
  } = useCurrentUserQuery()

  const handleLogout = useCallback(() => {
    logout()
    queryClient.clear()
    navigate("/login", { replace: true })
  }, [logout, navigate, queryClient])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (userLoading || userFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-5" /> Loading your workspace…
      </div>
    )
  }

  if (userError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">We couldn’t verify your session</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            Please try again. If the problem persists, sign in once more to refresh your session.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => refetchUser()}>Try again</Button>
          <Button variant="outline" onClick={handleLogout}>
            Back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar
        variant="inset"
        user={currentUser}
        isUserLoading={false}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <SiteHeader user={currentUser} onSignOut={handleLogout} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-5" /> Loading…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
