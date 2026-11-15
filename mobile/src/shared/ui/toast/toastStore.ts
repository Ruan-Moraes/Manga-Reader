import { create } from 'zustand';

export type ToastTone = 'success' | 'danger' | 'info' | 'warning';

export interface ToastMessage {
    id: number;
    tone: ToastTone;
    title: string;
    description?: string;
}

export const TOAST_DURATION_MS = 3500;
export const TOAST_ERROR_DURATION_MS = 5000;

interface ToastState {
    current: ToastMessage | null;
    show: (message: Omit<ToastMessage, 'id'>) => void;
    dismiss: (id?: number) => void;
}

let nextId = 1;

/** One toast at a time: a new message replaces the visible one (the newest result is the relevant one). */
export const useToastStore = create<ToastState>(set => ({
    current: null,
    show: message => set({ current: { ...message, id: nextId++ } }),
    dismiss: id => set(state => (id === undefined || state.current?.id === id ? { current: null } : state)),
}));

/**
 * Temporary feedback for the result of an action (success or failure). Persistent screen states (offline, a batch in
 * progress, an error with "try again") stay inline as `StatusMessage`.
 */
export function showToast(message: Omit<ToastMessage, 'id'>): void {
    useToastStore.getState().show(message);
}

export function toastDuration(tone: ToastTone): number {
    return tone === 'danger' || tone === 'warning' ? TOAST_ERROR_DURATION_MS : TOAST_DURATION_MS;
}
