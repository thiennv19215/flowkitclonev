import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import App from './App'
import ErrorBoundary from '@/components/ErrorBoundary'
import ToastViewport from '@/components/ToastViewport'
import { toast } from '@/store/toast'
import { ApiError } from '@/api/client'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      onError: (err) => {
        if (err instanceof ApiError) {
          toast.error(`API ${err.status || 'error'}`, err.message)
        } else if (err instanceof Error) {
          toast.error('Error', err.message)
        }
      },
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <ToastViewport />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
