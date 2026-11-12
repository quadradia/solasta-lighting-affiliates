import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { LanguageProvider, type Language } from '@/i18n'

export function envelope(payload: unknown, status = 200, extra: object = {}) {
  return new Response(JSON.stringify({ code: 0, message: 'Success', payload, ...extra }), { status })
}

/** Renders a page with routing, React Query (no retries) and a fixed language. */
export function renderPage(element: ReactElement, { language = 'en' as Language, path = '/' } = {}) {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <LanguageProvider initial={language}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </LanguageProvider>,
  )
}
