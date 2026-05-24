import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8100'

export interface SettingsState {
  apiBaseUrl: string
  theme: Theme
  setApiBaseUrl: (url: string) => void
  setTheme: (theme: Theme) => void
  reset: () => void
}

/**
 * Persistent app settings (API base URL, theme) backed by `localStorage`.
 *
 * Read from `useSettings()` inside React, or read once outside React with
 * `useSettings.getState()` (used by the API client).
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      theme: 'dark',
      setApiBaseUrl: (url) => set({ apiBaseUrl: normalizeBaseUrl(url) }),
      setTheme: (theme) => set({ theme }),
      reset: () =>
        set({
          apiBaseUrl: DEFAULT_API_BASE_URL,
          theme: 'dark',
        }),
    }),
    {
      name: 'flowkit-studio-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  return trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL
}
