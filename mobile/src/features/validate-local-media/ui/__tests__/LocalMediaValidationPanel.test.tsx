import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import i18n from '@/shared/i18n';
import { darkTokens, ThemeProvider } from '@/shared/theme';

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
        const current = draft([valid('item-1', 0), invalid('item-2', 1)]);
        render(<LocalMediaValidationPanel draft={current} onDraftChange={jest.fn()} controller={controller()} />);

        expect(screen.getByText('1 prontas · 1 com problema')).toBeTruthy();
        expect(screen.getByText('Com problema (1)')).toBeTruthy();
        await waitFor(() => expect(screen.queryByTestId('validation-thumbnail-item-1')).toBeNull());
        fireEvent.press(screen.getByRole('button', { name: 'Página 2 de 2. Ação necessária.' }));

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

        await waitFor(() => expect(screen.getByRole('button', { name: 'Substituir arquivo da página 2' })).toBeTruthy());
        fireEvent.press(screen.getByRole('button', { name: 'Substituir arquivo da página 2' }));

        await waitFor(() => expect(actions.replaceItem).toHaveBeenCalledWith(current, 'item-2'));
        expect(onDraftChange).toHaveBeenCalledWith(next);
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

    it('uses a readable elevated badge for page numbers in the dark theme', () => {
        render(
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <LocalMediaValidationPanel draft={draft([pending('item-1', 0)])} onDraftChange={jest.fn()} controller={controller()} />
            </ThemeProvider>,
        );

        expect(StyleSheet.flatten(screen.getByTestId('validation-page-badge-item-1', { includeHiddenElements: true }).props.style).backgroundColor).toBe(
            darkTokens.surfaceElevated,
        );
        expect(StyleSheet.flatten(screen.getByText('Pág. 1', { includeHiddenElements: true }).props.style).color).toBe(darkTokens.text);
    });
});
