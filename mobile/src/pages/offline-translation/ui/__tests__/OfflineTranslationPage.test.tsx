import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import type { CreateTranslationProjectController } from '@/src/features/create-translation-project';
import { type LocalMediaImportController, LocalMediaImportError } from '@/src/features/import-local-media';
import type { ReviewLocalMediaImportController } from '@/src/features/review-local-media-import';
import { api } from '@/src/shared/api';
import i18n from '@/src/shared/i18n';

import { OfflineTranslationPage } from '../OfflineTranslationPage';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockReplace(...args) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));

const draft: LocalMediaImportDraft = {
    id: 'draft-1',
    createdAt: 10,
    updatedAt: 10,
    confirmedAt: null,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: [
        { ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: null, createdAt: 10 },
        { ...PENDING_MEDIA_VALIDATION, id: 'item-2', position: 1, localFilename: 'item-2', byteSize: 20, mimeHint: null, createdAt: 10 },
    ],
};

function controller(overrides: Partial<LocalMediaImportController> = {}): LocalMediaImportController {
    return {
        initialize: jest.fn().mockResolvedValue(null),
        recoverPendingSelection: jest.fn().mockResolvedValue({ status: 'unchanged' }),
        selectImages: jest.fn().mockResolvedValue({ status: 'imported', draft }),
        ...overrides,
    };
}

function reviewController(overrides: Partial<ReviewLocalMediaImportController> = {}): ReviewLocalMediaImportController {
    return {
        reconcile: jest.fn().mockResolvedValue(undefined),
        itemUri: jest.fn((_draft, item) => `file:///private/draft-1/${item.localFilename}`),
        addImages: jest.fn().mockResolvedValue({ status: 'unchanged', draft }),
        removeItem: jest.fn().mockResolvedValue({ status: 'updated', draft }),
        moveItem: jest.fn().mockResolvedValue({ status: 'updated', draft }),
        confirm: jest.fn().mockResolvedValue({ status: 'updated', draft: { ...draft, confirmedAt: 20 } }),
        reload: jest.fn().mockResolvedValue(draft),
        ...overrides,
    };
}

const projectController: CreateTranslationProjectController = {
    initialize: jest.fn().mockResolvedValue(null),
    prepare: jest.fn(),
};

function renderPage(importController = controller(), reviewer = reviewController()) {
    return render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <OfflineTranslationPage importController={importController} reviewController={reviewer} projectController={projectController} />
        </SafeAreaProvider>,
    );
}

describe('MOB-FEAT-012 local media import page', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(async () => {
        apiMock.reset();
        mockPush.mockClear();
        mockReplace.mockClear();
        await i18n.changeLanguage('pt-BR');
    });
    afterAll(() => apiMock.restore());

    it('imports as guest, shows the count and makes no HTTP request', async () => {
        const importController = controller();
        renderPage(importController);

        await screen.findByRole('button', { name: 'Selecionar imagens' });
        await waitFor(() => expect(screen.getByRole('button', { name: 'Selecionar imagens' }).props.accessibilityState.disabled).toBe(false));
        fireEvent.press(screen.getByRole('button', { name: 'Selecionar imagens' }));

        expect(await screen.findByTestId('translation-flow-step-organize')).toBeOnTheScreen();
        expect(screen.getByText('Defina a ordem de leitura.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Confirmar ordem' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Módulos' })).toBeOnTheScreen();
        expect(screen.getByTestId('screen-scaffold-content').props.style).toEqual(expect.objectContaining({ gap: 16, paddingBottom: 16, paddingTop: 4 }));
        expect(screen.queryByText('Voltar aos módulos')).toBeNull();
        expect(importController.selectImages).toHaveBeenCalledTimes(1);
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.post).toHaveLength(0);
        expect(screen.queryByText(/traduzindo|processando|escolher idioma/i)).toBeNull();
    });

    it('keeps cancellation neutral without false success or error', async () => {
        renderPage(controller({ selectImages: jest.fn().mockResolvedValue({ status: 'cancelled' }) }));

        await screen.findByRole('button', { name: 'Selecionar imagens' });
        await waitFor(() => expect(screen.getByRole('button', { name: 'Selecionar imagens' })).toBeEnabled());
        fireEvent.press(screen.getByRole('button', { name: 'Selecionar imagens' }));
        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
        expect(screen.queryByText(/importada/)).toBeNull();
        expect(screen.getByRole('button', { name: 'Selecionar imagens' })).toBeOnTheScreen();
    });

    it('reveals independent language selection only after the page order is confirmed without HTTP', async () => {
        const reviewer = reviewController();
        renderPage(controller({ initialize: jest.fn().mockResolvedValue(draft) }), reviewer);

        expect(await screen.findByRole('button', { name: 'Confirmar ordem' })).toBeOnTheScreen();
        expect(screen.queryByText('Escolha os idiomas')).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Confirmar ordem' }));

        expect(await screen.findByText('Escolha os idiomas')).toBeOnTheScreen();
        expect(screen.getByLabelText('Idioma de origem').props.accessibilityRole).toBe('radiogroup');
        expect(screen.getByLabelText('Idioma de destino').props.accessibilityRole).toBe('radiogroup');
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.post).toHaveLength(0);
    });

    it('shows a localized retry without leaking native paths', async () => {
        renderPage(controller({ selectImages: jest.fn().mockRejectedValue(new LocalMediaImportError('storage-unavailable')) }));

        await screen.findByRole('button', { name: 'Selecionar imagens' });
        await waitFor(() => expect(screen.getByRole('button', { name: 'Selecionar imagens' })).toBeEnabled());
        fireEvent.press(screen.getByRole('button', { name: 'Selecionar imagens' }));

        expect(await screen.findByText('Não foi possível guardar as imagens no armazenamento privado.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
        expect(screen.queryByText(/content:\/\/|file:\/\//)).toBeNull();
    });

    it.each([
        ['en-US', 'Select images'],
        ['es-ES', 'Seleccionar imágenes'],
    ])('renders the accessible action in %s', async (language, label) => {
        await i18n.changeLanguage(language);
        renderPage();
        expect(await screen.findByRole('button', { name: label })).toBeOnTheScreen();
    });
});
