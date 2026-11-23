import type { TextFlowDocument } from '@/widgets/content-reader';

export function isNovelPreviewEnabled(isDevelopment: boolean): boolean {
    return isDevelopment;
}

export function createNovelPreviewDocument(copy: {
    title: string;
    heading: string;
    paragraphOne: string;
    speaker: string;
    dialogue: string;
    paragraphTwo: string;
    illustration?: { uri: string; width: number; height: number; description: string };
}): TextFlowDocument {
    return {
        kind: 'TEXT_FLOW',
        id: 'novel-development-preview',
        title: copy.title,
        blocks: [
            { id: 'heading-1', type: 'heading', text: copy.heading },
            { id: 'paragraph-1', type: 'paragraph', text: copy.paragraphOne },
            { id: 'dialogue-1', type: 'dialogue', speaker: copy.speaker, text: copy.dialogue },
            { id: 'divider-1', type: 'divider' },
            { id: 'paragraph-2', type: 'paragraph', text: copy.paragraphTwo },
            ...(copy.illustration ? [{ id: 'illustration', type: 'image' as const, ...copy.illustration }] : []),
            // Deliberately synthetic, localized long fixture: variable paragraphs include blocks taller than a screen.
            ...Array.from({ length: 48 }, (_, section) => [
                { id: `section-${section}`, type: 'heading' as const, text: copy.heading },
                { id: `long-${section}`, type: 'paragraph' as const, text: Array.from({ length: 1 + (section % 8) }, () => copy.paragraphOne).join(' ') },
                { id: `speech-${section}`, type: 'dialogue' as const, speaker: copy.speaker, text: copy.dialogue },
                { id: `short-${section}`, type: 'paragraph' as const, text: copy.paragraphTwo },
                { id: `break-${section}`, type: 'divider' as const },
            ]).flat(),
        ],
    };
}
