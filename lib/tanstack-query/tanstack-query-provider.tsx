'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function TanstackQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduce stale time to improve responsiveness
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Cache for 10 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus for better performance
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
