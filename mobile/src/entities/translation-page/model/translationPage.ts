export const TRANSLATION_STATES = ['DRAFT', 'QUEUED', 'PROCESSING', 'READY', 'FAILED', 'CANCELLED'] as const;

export type TranslationState = (typeof TRANSLATION_STATES)[number];

export interface TranslationPage {
    id: string;
    projectId: string;
    position: number;
    originalFilename: string;
    originalByteSize: number;
    originalMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    widthPx: number;
    heightPx: number;
    mediaValidatedAt: number;
    mediaValidationPolicyVersion: number;
    status: TranslationState;
    createdAt: number;
    updatedAt: number;
    statusUpdatedAt: number;
}

const ALLOWED_TRANSITIONS: Readonly<Record<TranslationState, readonly TranslationState[]>> = {
    DRAFT: ['QUEUED', 'CANCELLED'],
    QUEUED: ['PROCESSING', 'FAILED', 'CANCELLED'],
    PROCESSING: ['READY', 'FAILED', 'CANCELLED'],
    READY: [],
    FAILED: ['QUEUED', 'CANCELLED'],
    CANCELLED: [],
};

export function isTranslationState(value: unknown): value is TranslationState {
    return typeof value === 'string' && TRANSLATION_STATES.some(state => state === value);
}

export function canTransitionTranslationState(from: TranslationState, to: TranslationState): boolean {
    return ALLOWED_TRANSITIONS[from].some(state => state === to);
}

export function isTerminalTranslationState(state: TranslationState): boolean {
    return state === 'READY' || state === 'CANCELLED';
}
