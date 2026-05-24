import { create } from 'zustand'

export type ToastVariant = 'info' | 'success' | 'error' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = crypto.randomUUID()
    const toast: Toast = { id, duration: 4000, ...t }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    if (toast.duration && toast.duration > 0) {
      window.setTimeout(() => get().dismiss(id), toast.duration)
    }
    return id
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export const toast = {
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'info', title, description }),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({
      variant: 'error',
      title,
      description,
      duration: 6000,
    }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'warning', title, description }),
}
