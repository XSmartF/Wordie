import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";

// Lazy load pages for better performance
const LoginPage = lazy(() => import("@/features/auth/pages/login-page"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page"));
const StudyPage = lazy(() => import("@/features/study/pages/study-page"));
const WordSetsPage = lazy(() => import("@/features/word-sets/pages/word-sets-page"));
const WordSetDetailPage = lazy(() => import("@/features/word-sets/pages/word-set-detail-page"));

// Lazy load layouts
const DefaultLayout = lazy(() => import("@/shared/layouts/default"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "study",
        element: <StudyPage />,
      },
      {
        path: "wordsets",
        children: [
          {
            index: true,
            element: <WordSetsPage />,
          },
          {
            path: ":id",
            element: <WordSetDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);