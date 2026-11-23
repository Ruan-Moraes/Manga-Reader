import { createNovelPreviewDocument, isNovelPreviewEnabled } from '../novelPreview';

describe('MOB-FEAT-051/AC-004/005 novel development preview', () => {
    it('refuses production and preserves the ordered structured contract', () => {
        expect(isNovelPreviewEnabled(false)).toBe(false);
        const document = createNovelPreviewDocument({
            title: 'Title',
            heading: 'Heading',
            paragraphOne: 'One',
            speaker: 'Lira',
            dialogue: 'Hello',
            paragraphTwo: 'Two',
            illustration: { uri: 'asset', width: 600, height: 400, description: 'Demo' },
        });
        expect(document.blocks.slice(0, 5).map(block => [block.id, block.type])).toEqual([
            ['heading-1', 'heading'],
            ['paragraph-1', 'paragraph'],
            ['dialogue-1', 'dialogue'],
            ['divider-1', 'divider'],
            ['paragraph-2', 'paragraph'],
        ]);
        expect(document.blocks.length).toBeGreaterThan(200);
        expect(new Set(document.blocks.map(block => block.id)).size).toBe(document.blocks.length);
        expect(document.blocks.find(block => block.type === 'image')).toMatchObject({ width: 600, height: 400 });
        const lengths = document.blocks.filter(block => block.type === 'paragraph').map(block => block.text.length);
        expect(Math.max(...lengths)).toBeGreaterThan(Math.min(...lengths) * 5);
    });
});
