import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Config reads these at import time; tests never contact real servers.
vi.stubEnv('VITE_OIDC_AUTHORITY', 'https://identity.test')
vi.stubEnv('VITE_OIDC_CLIENT_ID', 'affiliate-portal')
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')

afterEach(() => {
  cleanup()
})
