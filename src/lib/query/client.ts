import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/http";

/**
 * Shared React Query client configuration.
 *
 * Philosophy:
 *   - Reads are cached generously (5 minutes) because seller data doesn't
 *     change on its own.
 *   - Writes trigger targeted invalidation, so the cache updates the moment
 *     something changes.
 *   - Errors are retried a little on the network, but never on 4xx — those
 *     are the client's fault, not a transient failure.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // How long data is considered fresh (no refetch during this window).
        staleTime: 5 * 60_000,

        // How long unused data stays in memory before being garbage-collected.
        gcTime: 30 * 60_000,

        // Don't refetch every time the user alt-tabs back.
        refetchOnWindowFocus: false,

        // Do refetch when the browser comes back online.
        refetchOnReconnect: true,

        // Keep the old data visible while a new fetch is in flight, so lists
        // don't flash to a loading state on filter/sort changes.
        placeholderData: (prev: unknown) => prev,

        retry: (failureCount, error) => {
          // Never retry 4xx errors — they won't succeed on a second try.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}