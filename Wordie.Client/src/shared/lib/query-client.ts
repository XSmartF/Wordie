import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

function handleQueryError(error: unknown) {
  if (import.meta.env.DEV) {
    // Surface query failures while keeping production quiet.
    console.error("React Query error", error);
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // cache successful responses for a minute by default
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) {
          return false;
        }

        // Skip retries for 4xx responses to avoid hammering the API.
        const status =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { status?: number } }).response?.status === "number"
            ? (error as { response: { status: number } }).response.status
            : null;

        if (status && status >= 400 && status < 500) {
          return false;
        }

        return true;
      },
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleQueryError,
  }),
});
