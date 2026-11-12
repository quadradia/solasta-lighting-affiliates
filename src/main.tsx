import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from 'react-oidc-context'
import { Toaster } from 'sonner'
import { App } from './App'
import { ApiError } from './lib/api'
import { userManager } from './lib/auth'
import { LanguageProvider } from './i18n'
import './main.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network blips and server faults, not 4xx answers that will not change.
      retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

// After the code exchange, drop ?code=&state= from the address bar; CallbackPage then navigates on.
const onSigninCallback = () => window.history.replaceState({}, document.title, window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster theme="dark" position="top-center" richColors closeButton />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
