import { FlatList, StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Image } from 'expo-image';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import i18n from '@/shared/i18n';
import { darkTokens, lightTokens, ThemeProvider } from '@/shared/theme';

import type { ValidateLocalMediaController } from '../../model/validateLocalMedia';
import type { ValidationPresentationIssue } from '../../model/validationPresentation';
import { LocalMediaValidationPanel } from '../LocalMediaValidationPanel';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));

const pending = (id: string, position: number) => ({
    ...PENDING_MEDIA_VALIDATION,
    id,
    position,
    localFilename: id,
    byteSize: 10,
    mimeHint: null,
    createdAt: 1,
});

const valid = (id: string, position: number) => ({
    ...pending(id, position),
    mediaValidationStatus: 'VALID' as const,
    detectedMimeType: 'image/png' as const,
    widthPx: 100,
    heightPx: 200,
    validatedAt: 9,
    validationPolicyVersion: 1,
});

const invalid = (id: string, position: number) => ({
    ...pending(id, position),
    mediaValidationStatus: 'INVALID' as const,
    mediaValidationError: 'CORRUPTED' as const,
    validatedAt: 9,
    validationPolicyVersion: 1,
});

const draft = (items = [pending('item-1', 0), invalid('item-2', 1)]): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 10,
    confirmedAt: 5,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: 8,
    items,
});

const controller = (replacement = draft([valid('item-1', 0), pending('item-2', 1)])): ValidateLocalMediaController => ({
    itemUri: (_draft, item) => `file://${item.localFilename}`,
    validate: jest.fn(async current => current),
    replaceItem: jest.fn(async () => replacement),
    reload: jest.fn(async () => replacement),
});

describe('MOB-FEAT-045 validation gallery', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('summarizes a mixed batch, defaults to issues and opens a human-readable local detail', async () => {
        const current = draft([
            valid('item-1', 0),
            invalid('item-2', 1),
            { ...invalid('item-3', 2), mediaValidationError: 'EMPTY_FILE' },
        ]);
        render(<LocalMediaValidationPanel draft={current} onDraftChange={jest.fn()} controller={controller()} />);

        const summary = within(await screen.findByTestId('validation-issue-summary'));
        expect(summary.getByText('1 prontas · 2 com problema')).toBeOnTheScreen();
        expect(summary.getByText('Pág. 2')).toBeOnTheScreen();
        expect(summary.getByText('Não foi possível abrir esta imagem com segurança.')).toBeOnTheScreen();
        expect(summary.getByText('Pág. 3')).toBeOnTheScreen();
        expect(summary.getByText('O arquivo está vazio e não pode ser processado.')).toBeOnTheScreen();
        fireEvent.press(summary.getByRole('button', { name: 'Ir para correção' }));
        expect(screen.getByText('Com problema (2)')).toBeTruthy();
        await waitFor(() => expect(screen.queryByTestId('validation-thumbnail-item-1')).toBeNull());
        expect(screen.UNSAFE_getByType(FlatList).props.numColumns).toBe(2);
        fireEvent.press(screen.getByRole('radio', { name: 'Todas (3)' }));
        expect(screen.UNSAFE_getByType(FlatList).props.numColumns).toBe(2);
        expect(within(screen.getByTestId('validation-thumbnail-item-1')).getByText('Pronta')).toBeOnTheScreen();
        const thumbnail = within(screen.getByTestId('validation-thumbnail-item-2'));
        fireEvent.press(thumbnail.getByRole('button', { name: 'arquivo corrompido' }));

        expect(screen.getByText('Não foi possível abrir esta imagem com segurança.')).toBeTruthy();
        expect(screen.getByText('Origem: arquivo enviado · verificação feita neste aparelho')).toBeTruthy();
        expect(screen.queryByText('CORRUPTED')).toBeNull();
    });

    it('replaces only the selected page from its own action', async () => {
        const current = draft([valid('item-1', 0), invalid('item-2', 1)]);
        const next = draft([valid('item-1', 0), pending('item-2', 1)]);
        const actions = controller(next);
        const onDraftChange = jest.fn();
        render(<LocalMediaValidationPanel draft={current} onDraftChange={onDraftChange} controller={actions} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Ir para correção' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Substituir arquivo da página 2' })).toBeTruthy());
        fireEvent.press(screen.getByRole('button', { name: 'Substituir arquivo da página 2' }));

        await waitFor(() => expect(actions.replaceItem).toHaveBeenCalledWith(current, 'item-2'));
        expect(onDraftChange).toHaveBeenCalledWith(next);
    });

    it('rotula as ações da página com problema e mantém as miniaturas locais só em memória (revisão 2026-11-13)', async () => {
        const current = draft([valid('item-1', 0), invalid('item-2', 1)]);
        render(<LocalMediaValidationPanel draft={current} onDraftChange={jest.fn()} controller={controller()} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Ir para correção' }));
        const thumbnail = within(await screen.findByTestId('validation-thumbnail-item-2'));

        expect(thumbnail.getByText('Ver problema')).toBeOnTheScreen();
        expect(thumbnail.getByText('Substituir')).toBeOnTheScreen();
        expect(thumbnail.getByRole('button', { name: 'arquivo corrompido' })).toBeOnTheScreen();
        expect(thumbnail.getByRole('button', { name: 'Substituir arquivo da página 2' })).toBeOnTheScreen();
        expect(screen.UNSAFE_getAllByType(Image).every(image => image.props.cachePolicy === 'memory')).toBe(true);
    });

    it('a página inválida também pode ser removida da seleção (2026-11-10)', async () => {
        const current = draft([valid('item-1', 0), invalid('item-2', 1)]);
        const onRemoveItem = jest.fn().mockResolvedValue(undefined);
        render(<LocalMediaValidationPanel draft={current} onDraftChange={jest.fn()} controller={controller()} onRemoveItem={onRemoveItem} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Ir para correção' }));
        fireEvent.press(screen.getByRole('button', { name: 'Página 2 de 2. Ação necessária.' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Remover a página 2 da seleção' }));
        await waitFor(() => expect(onRemoveItem).toHaveBeenCalledWith(current.items[1]));
    });

    it('shows success without an exhaustive list and advances only from the ready CTA', () => {
        const current = draft([valid('item-1', 0), valid('item-2', 1)]);
        const onContinue = jest.fn();
        render(<LocalMediaValidationPanel draft={current} onDraftChange={jest.fn()} onContinue={onContinue} controller={controller()} />);

        expect(screen.getByText('2 de 2 prontas')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Continuar para revisão' }));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('identifies a supplied processing issue without claiming local detection', () => {
        const current = draft([valid('item-1', 0)]);
        const issue: ValidationPresentationIssue = {
            origin: 'processing',
            code: 'WHITE_OUTLINE',
            technicalDetail: 'WHITE_OUTLINE',
        };
        render(
            <LocalMediaValidationPanel draft={current} onDraftChange={jest.fn()} controller={controller()} processingIssues={new Map([['item-1', issue]])} />,
        );

        fireEvent.press(screen.getByRole('button', { name: 'Ir para correção' }));
        fireEvent.press(screen.getByRole('button', { name: 'Página 1 de 1. Ação necessária.' }));
        expect(screen.getByText('Origem: retorno do processamento')).toBeTruthy();
        expect(screen.getByText('O processamento encontrou contornos brancos na imagem.')).toBeTruthy();
    });

    it.each(['en-US', 'es-ES'])('renders localized actions in %s', async locale => {
        await i18n.changeLanguage(locale);
        render(<LocalMediaValidationPanel draft={draft([pending('item-1', 0)])} onDraftChange={jest.fn()} controller={controller()} />);
        expect(screen.getByTestId('validation-thumbnail-grid')).toBeTruthy();
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it.each(['light', 'dark'] as const)('uses an opaque page number badge in %s', scheme => {
        render(
            <ThemeProvider initialOverride={scheme} waitForPlatform={false}>
                <LocalMediaValidationPanel draft={draft([pending('item-1', 0)])} onDraftChange={jest.fn()} controller={controller()} />
            </ThemeProvider>,
        );

        expect(StyleSheet.flatten(screen.getByTestId('validation-page-badge-item-1', { includeHiddenElements: true }).props.style).backgroundColor).toBe(
            (scheme === 'dark' ? darkTokens : lightTokens).surfaceElevated,
        );
        expect(StyleSheet.flatten(screen.getByText('Pág. 1', { includeHiddenElements: true }).props.style).color).toBe((scheme === 'dark' ? darkTokens : lightTokens).text);
    });
});
