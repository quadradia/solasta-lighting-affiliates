import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAffiliate } from '@/components/RequireAffiliate'
import { DashboardPage } from '@/features/portal/DashboardPage'
import { EarningsPage } from '@/features/portal/EarningsPage'
import { ProfilePage } from '@/features/portal/ProfilePage'
import { SharePage } from '@/features/portal/SharePage'
import { CallbackPage } from '@/pages/CallbackPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const routes = [
  // Must match the redirect URI registered for the affiliate-portal client.
  { path: '/callback', element: <CallbackPage /> },
  {
    element: (
      <RequireAffiliate>
        <AppLayout />
      </RequireAffiliate>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'share', element: <SharePage /> },
      { path: 'earnings', element: <EarningsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

const router = createBrowserRouter(routes)

export function App() {
  return <RouterProvider router={router} />
}
