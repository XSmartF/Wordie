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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100/60 bg-white/90 px-6 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-slate-900/80">
          <Spinner className="size-5 text-indigo-500" /> Loading your workspace…
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-50 px-4 text-center dark:bg-slate-950">
        <div className="card-glow max-w-md space-y-3 rounded-2xl border border-indigo-100/60 bg-white/90 px-8 py-6 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-slate-900/80">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            We couldn’t verify your session
          </h1>
          <p className="text-sm text-muted-foreground">
            Please try again. If the problem persists, sign in once more to refresh your session.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button onClick={() => refetchUser()} className="bg-indigo-600 text-white hover:bg-indigo-500">
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-indigo-100/70 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={sidebarStyle}
      className="bg-gray-50 text-gray-800 dark:bg-slate-950 dark:text-slate-100"
    >
      <AppSidebar
        variant="inset"
        user={currentUser}
        isUserLoading={false}
        onLogout={handleLogout}
      />
  <SidebarInset className="bg-linear-to-br from-gray-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/40">
        <SiteHeader user={currentUser} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 pb-6 pt-4">
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center">
                  <div className="card-glow flex items-center gap-3 rounded-2xl border border-indigo-100/60 bg-white/90 px-6 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-slate-900/80">
                    <Spinner className="size-5 text-indigo-500" /> Loading…
                  </div>
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
