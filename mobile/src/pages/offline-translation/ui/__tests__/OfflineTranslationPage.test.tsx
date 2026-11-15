import { FlatList } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import type { TranslationProject } from '@/entities/translation-project';
import type { CreateTranslationProjectController } from '@/features/create-translation-project';
import { type LocalMediaImportController, LocalMediaImportError } from '@/features/import-local-media';
import type { ReviewLocalMediaImportController } from '@/features/review-local-media-import';
import type { ValidateLocalMediaController } from '@/features/validate-local-media';
import { api } from '@/shared/api';
import { useDeveloperMode } from '@/shared/config';
import i18n from '@/shared/i18n';

import { FlowSummary } from '../FlowSummary';
import { OfflineTranslationPage } from '../OfflineTranslationPage';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockRemoteActivity = false;

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), canGoBack: () => false, push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockReplace(...args) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: jest.requireActual('react-native').View }));
jest.mock('@/widgets/remote-processing', () => ({
    ChapterBatchPanel: ({ onActivityChange, headerContent }: { onActivityChange?: (active: boolean) => void; headerContent?: import('react').ReactNode }) => {
        const React = jest.requireActual<typeof import('react')>('react');
        React.useEffect(() => {
            onActivityChange?.(mockRemoteActivity);
        }, [onActivityChange]);
        return headerContent ?? null;
    },
}));

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
        reorderItems: jest.fn().mockResolvedValue({ status: 'updated', draft }),
        confirm: jest.fn().mockResolvedValue({ status: 'updated', draft: { ...draft, confirmedAt: 20 } }),
        reload: jest.fn().mockResolvedValue(draft),
        ...overrides,
    };
}

const projectController: CreateTranslationProjectController = {
    initialize: jest.fn().mockResolvedValue(null),
    prepare: jest.fn(),
};

function validationController(): ValidateLocalMediaController {
    return {
        itemUri: (_draft, item) => `file:///private/draft-1/${item.localFilename}`,
        validate: jest.fn(async current => current),
        replaceItem: jest.fn(async current => current),
        reload: jest.fn(async () => null),
    };
}

function renderPage(importController = controller(), reviewer = reviewController(), validator = validationController(), projects = projectController) {
    return render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <OfflineTranslationPage
                importController={importController}
                reviewController={reviewer}
                validationController={validator}
                projectController={projects}
            />
        </SafeAreaProvider>,
    );
}

describe('MOB-FEAT-012 local media import page', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(async () => {
        apiMock.reset();
        mockPush.mockClear();
        mockReplace.mockClear();
        mockRemoteActivity = false;
        await i18n.changeLanguage('pt-BR');
    });
    afterAll(() => apiMock.restore());

    it('alinha os cantos do retorno aos da ação do cabeçalho', async () => {
        renderPage();

        const back = await screen.findByRole('button', { name: 'Voltar' });
        const home = screen.getByRole('button', { name: 'Início' });
        expect(back).toHaveStyle({ borderRadius: 12 });
        expect(home).toHaveStyle({ borderRadius: 12 });
    });

    it('imports as guest, shows the count and makes no HTTP request', async () => {
        const importController = controller();
        renderPage(importController);

        await screen.findAllByRole('button', { name: 'Selecionar imagens' });
        await waitFor(() => expect(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0].props.accessibilityState.disabled).toBe(false));
        fireEvent.press(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]);

        expect(await screen.findByTestId('translation-flow-step-organize')).toBeOnTheScreen();
        // MOB-FEAT-056: sem título por etapa; a etapa visível é anunciada pela StepBar.
        expect(screen.getByTestId('step-bar')).toHaveProp('accessibilityLabel', 'Etapa 1 de 3: Páginas');
        expect(screen.getByRole('button', { name: 'Confirmar ordem' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Início' })).toBeOnTheScreen();
        expect(screen.getByTestId('screen-scaffold-content').props.style).toEqual(expect.objectContaining({ paddingBottom: 0 }));
        expect(screen.getByTestId('screen-scaffold-body').props.style).toEqual(expect.objectContaining({ gap: 16 }));
        expect(screen.queryByText('Voltar aos módulos')).toBeNull();
        expect(importController.selectImages).toHaveBeenCalledTimes(1);
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.post).toHaveLength(0);
        expect(screen.queryByText(/traduzindo|processando|escolher idioma/i)).toBeNull();
    });

    it('keeps cancellation neutral without false success or error', async () => {
        renderPage(controller({ selectImages: jest.fn().mockResolvedValue({ status: 'cancelled' }) }));

        await screen.findAllByRole('button', { name: 'Selecionar imagens' });
        await waitFor(() => expect(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]).toBeEnabled());
        fireEvent.press(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]);
        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
        expect(screen.queryByText(/importada/)).toBeNull();
        expect(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]).toBeOnTheScreen();
    });

    it('voltar na etapa Páginas pergunta se mantém ou descarta o rascunho, sem prender o usuário (2026-11-10)', async () => {
        const discard = jest.fn().mockResolvedValue(undefined);
        const importer = controller({ initialize: jest.fn().mockResolvedValue(draft), discard });
        renderPage(importer);

        expect(await screen.findByTestId('translation-flow-step-organize')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
        expect(await screen.findByText('Sair da tradução?')).toBeOnTheScreen();
        expect(screen.getByTestId('flow-exit-sheet')).toBeOnTheScreen();
        const actions = within(screen.getByTestId('flow-exit-actions'));
        expect(actions.getAllByRole('button').map(button => button.props.accessibilityLabel ?? within(button).getByText(/.+/).props.children)).toEqual([
            'Sair e manter rascunho',
            'Continuar aqui',
            'Descartar páginas',
        ]);
        fireEvent.press(screen.getByRole('button', { name: 'Continuar aqui' }));
        await waitFor(() => expect(screen.queryByText('Sair da tradução?')).toBeNull());
        expect(mockReplace).not.toHaveBeenCalled();

        fireEvent.press(screen.getByRole('button', { name: 'Cancelar tradução' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Sair e manter rascunho' }));
        expect(discard).not.toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it('descartar as páginas apaga o rascunho e sai; limpar e recomeçar volta ao início do fluxo (2026-11-10)', async () => {
        const discard = jest.fn().mockResolvedValue(undefined);
        renderPage(controller({ initialize: jest.fn().mockResolvedValueOnce(draft).mockResolvedValue(null), discard }));
        await screen.findByTestId('translation-flow-step-organize');

        // Revisão 2026-11-13: confirmar vem primeiro; recomeçar é uma ação discreta abaixo dele.
        const buttons = screen.getAllByRole('button');
        const confirmIndex = buttons.indexOf(screen.getByRole('button', { name: 'Confirmar ordem' }));
        expect(confirmIndex).toBeGreaterThan(-1);
        expect(confirmIndex).toBeLessThan(buttons.indexOf(screen.getByRole('button', { name: 'Limpar e recomeçar' })));

        fireEvent.press(screen.getByRole('button', { name: 'Limpar e recomeçar' }));
        // Revisão 2026-11-14: diz quantas páginas saem e mantém o cancelar explícito.
        expect(await screen.findByText(/serão apagadas deste aparelho\. Não dá para desfazer\./)).toBeOnTheScreen();
        expect(within(screen.getByTestId('confirm-sheet')).getByRole('button', { name: 'Manter páginas' })).toBeOnTheScreen();
        fireEvent.press(await screen.findByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
        expect(await screen.findByTestId('translation-flow-step-import')).toBeOnTheScreen();
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('Novo capítulo com seleção antiga pergunta antes de usar essas páginas (2026-11-10)', async () => {
        const discard = jest.fn().mockResolvedValue(undefined);
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <OfflineTranslationPage
                    importController={controller({ initialize: jest.fn().mockResolvedValueOnce(draft).mockResolvedValue(null), discard })}
                    reviewController={reviewController()}
                    validationController={validationController()}
                    projectController={projectController}
                    workTarget={{ workId: 'w1', label: '4' }}
                    worksController={{ attachProjectToWork: jest.fn(), initialize: jest.fn(async () => []), listChapters: jest.fn(async () => []) }}
                />
            </SafeAreaProvider>,
        );
        expect(await screen.findByText('Há uma seleção anterior')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Começar do zero' }));
        await waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
        expect(await screen.findByTestId('translation-flow-step-import')).toBeOnTheScreen();
    });

    it('com a ordem já confirmada, a etapa Páginas oferece Continuar em vez de um botão desabilitado (2026-11-10)', async () => {
        renderPage(controller({ initialize: jest.fn().mockResolvedValue({ ...draft, confirmedAt: 9, languagesConfirmedAt: 9 }) }));
        await screen.findByTestId('translation-flow-step-validate');
        fireEvent.press(screen.getByRole('button', { name: 'Etapa anterior' }));
        expect(await screen.findByTestId('translation-flow-step-organize')).toBeOnTheScreen();
        expect(within(screen.getByTestId('status-message')).getByText('Lote revisado')).toBeOnTheScreen();
        expect(within(screen.getByTestId('local-media-review-footer')).queryByText('Lote revisado')).toBeNull();
        fireEvent.press(await screen.findByTestId('review-continue'));
        expect(await screen.findByTestId('translation-flow-step-validate')).toBeOnTheScreen();
    });

    it('reveals independent language selection only after the page order is confirmed without HTTP', async () => {
        const reviewer = reviewController();
        renderPage(controller({ initialize: jest.fn().mockResolvedValue(draft) }), reviewer);

        expect(await screen.findByRole('button', { name: 'Confirmar ordem' })).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: /^Idioma de origem:/ })).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Confirmar ordem' }));

        expect(await screen.findByRole('button', { name: 'Idioma de origem: Japonês' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Idioma de destino: Português (Brasil)' })).toBeOnTheScreen();
        // MOB-FEAT-056: sem título por etapa; a etapa visível é anunciada pela StepBar.
        expect(screen.getByTestId('step-bar')).toHaveProp('accessibilityLabel', 'Etapa 2 de 3: Idiomas');
        expect(screen.queryByText('Escolha os idiomas')).toBeNull();
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.post).toHaveLength(0);
    });

    it('shows a localized retry without leaking native paths', async () => {
        renderPage(controller({ selectImages: jest.fn().mockRejectedValue(new LocalMediaImportError('storage-unavailable')) }));

        await screen.findAllByRole('button', { name: 'Selecionar imagens' });
        await waitFor(() => expect(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]).toBeEnabled());
        fireEvent.press(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]);

        expect(await screen.findByText('Não foi possível guardar as imagens no armazenamento privado.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
        expect(screen.queryByText(/content:\/\/|file:\/\//)).toBeNull();
    });

    it('keeps a ready validation result visible until the user continues to review', async () => {
        const readyDraft: LocalMediaImportDraft = {
            ...draft,
            confirmedAt: 9,
            languagesConfirmedAt: 9,
            items: draft.items.map(item => ({
                ...item,
                mediaValidationStatus: 'VALID',
                detectedMimeType: 'image/png',
                widthPx: 100,
                heightPx: 200,
                validatedAt: 9,
                validationPolicyVersion: 1,
            })),
        };
        renderPage(controller({ initialize: jest.fn().mockResolvedValue(readyDraft) }));

        expect(await screen.findByTestId('translation-flow-step-review')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Etapa anterior' }));

        // MOB-FEAT-056: sem título por etapa; a etapa visível é anunciada pela StepBar.
        await waitFor(() => expect(screen.getByTestId('step-bar')).toHaveProp('accessibilityLabel', 'Etapa 2 de 3: Idiomas'));
        fireEvent.press(screen.getByRole('button', { name: 'Continuar para revisão' }));
        expect(await screen.findByTestId('translation-flow-step-review')).toBeOnTheScreen();
    });

    it('restores a prepared project on the final step without returning to import', async () => {
        const prepared: TranslationProject = {
            id: 'project-1',
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            status: 'DRAFT',
            createdAt: 10,
            updatedAt: 10,
            statusUpdatedAt: 10,
            languageReviewRequired: false,
            pages: [],
        };
        const projects: CreateTranslationProjectController = {
            initialize: jest.fn().mockResolvedValue(prepared),
            prepare: jest.fn(),
        };

        renderPage(controller(), reviewController(), validationController(), projects);

        // MOB-FEAT-056: o projeto anterior não abre sozinho; fica no link "Retomar último capítulo".
        fireEvent.press(await screen.findByRole('button', { name: 'Retomar último capítulo' }));
        expect(await screen.findByTestId('translation-flow-step-review')).toBeOnTheScreen();
        expect(screen.getByTestId('step-bar')).toHaveProp('accessibilityLabel', 'Etapa 3 de 3: Traduzir');
        expect(screen.queryByText('Cada imagem é uma página.')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Gerar resultado de demonstração' })).toBeNull();
        act(() => useDeveloperMode.setState({ hydrated: true, enabled: true }));
        try {
            expect(screen.getByRole('button', { name: 'Gerar resultado de demonstração' })).toBeOnTheScreen();
        } finally {
            act(() => useDeveloperMode.setState({ enabled: false }));
        }
        fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
        expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it('confirms leaving for Home while processing is active', async () => {
        mockRemoteActivity = true;
        const prepared: TranslationProject = {
            id: 'project-1',
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            status: 'DRAFT',
            createdAt: 10,
            updatedAt: 10,
            statusUpdatedAt: 10,
            languageReviewRequired: false,
            pages: [],
        };
        renderPage(controller(), reviewController(), validationController(), { initialize: jest.fn(async () => prepared), prepare: jest.fn() });
        fireEvent.press(await screen.findByRole('button', { name: 'Retomar último capítulo' }));
        await screen.findByTestId('translation-flow-step-review');
        fireEvent.press(screen.getByRole('button', { name: 'Início' }));
        expect(await screen.findByText('Sair durante o processamento?')).toBeOnTheScreen();
        expect(mockReplace).not.toHaveBeenCalled();
        fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
        expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it.each([
        ['pt-BR', 'As páginas e os idiomas estão salvos neste aparelho.'],
        ['en-US', 'The pages and language pair are saved on this device.'],
        ['es-ES', 'Las páginas y los idiomas están guardados en este dispositivo.'],
    ])('restores READY without claiming processing has not begun in %s', async (locale, description) => {
        await i18n.changeLanguage(locale);
        const ready: TranslationProject = {
            id: 'ready-project',
            sourceLanguage: 'en',
            targetLanguage: 'pt-BR',
            status: 'READY',
            createdAt: 10,
            updatedAt: 10,
            statusUpdatedAt: 10,
            languageReviewRequired: false,
            pages: [],
        };
        renderPage(controller(), reviewController(), validationController(), { initialize: jest.fn(async () => ready), prepare: jest.fn() });
        fireEvent.press(await screen.findByRole('button', { name: i18n.t('launcher:offline.flow3.resume') }));
        expect(await screen.findByText(description)).toBeOnTheScreen();
        expect(screen.queryByText(i18n.t('launcher:offline.project.preparedDescription'))).toBeNull();
    });

    it.each([
        ['en-US', 'Select images'],
        ['es-ES', 'Seleccionar imágenes'],
    ])('renders the accessible action in %s', async (language, label) => {
        await i18n.changeLanguage(language);
        renderPage();
        expect((await screen.findAllByRole('button', { name: label }))[0]).toBeOnTheScreen();
    });

    describe('chapter target', () => {
        const readyDraft: LocalMediaImportDraft = {
            ...draft,
            confirmedAt: 9,
            languagesConfirmedAt: 9,
            items: draft.items.map(item => ({
                ...item,
                mediaValidationStatus: 'VALID',
                detectedMimeType: 'image/png',
                widthPx: 100,
                heightPx: 200,
                validatedAt: 9,
                validationPolicyVersion: 1,
            })),
        };
        const prepared = (createdAt: number): TranslationProject => ({
            id: 'project-new',
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            status: 'DRAFT',
            createdAt,
            updatedAt: createdAt,
            statusUpdatedAt: createdAt,
            languageReviewRequired: false,
            pages: [],
        });
        const prepareFlow = async (project: TranslationProject, attach: jest.Mock) => {
            render(
                <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                    <OfflineTranslationPage
                        importController={controller({ initialize: jest.fn().mockResolvedValueOnce(readyDraft).mockResolvedValue(null) })}
                        reviewController={reviewController()}
                        validationController={validationController()}
                        projectController={{
                            initialize: jest.fn().mockResolvedValueOnce(null).mockResolvedValue(project),
                            prepare: jest.fn().mockResolvedValue(project),
                        }}
                        workTarget={{ workId: 'work-1', label: 'Capítulo 3' }}
                        worksController={{ attachProjectToWork: attach, initialize: jest.fn(async () => []), listChapters: jest.fn(async () => []) }}
                    />
                </SafeAreaProvider>,
            );
            fireEvent.press(await screen.findByRole('button', { name: i18n.t('launcher:offline.flow3.translatePages', { count: readyDraft.items.length }) }));
        };

        it('links the project prepared in this session to the chosen work exactly once', async () => {
            const attach = jest.fn().mockResolvedValue(undefined);
            await prepareFlow(prepared(Date.now() + 60_000), attach);
            await waitFor(() => expect(attach).toHaveBeenCalledWith('work-1', 'project-new', 'Capítulo 3'));
            expect(attach).toHaveBeenCalledTimes(1);
        });

        it('shows an alert and keeps the prepared project when linking fails', async () => {
            const attach = jest.fn().mockRejectedValue(new Error('localWork.notFoundOrStale'));
            await prepareFlow(prepared(Date.now() + 60_000), attach);
            expect(await screen.findByRole('alert')).toBeOnTheScreen();
        });

        it('never links a project that predates the session', async () => {
            const attach = jest.fn().mockResolvedValue(undefined);
            await prepareFlow(prepared(1), attach);
            await waitFor(() => expect(screen.getByTestId('translation-flow-step-import')).toBeOnTheScreen());
            expect(screen.getAllByRole('button', { name: 'Selecionar imagens' })[0]).toBeOnTheScreen();
            expect(attach).not.toHaveBeenCalled();
        });
    });
});

describe('MOB-FEAT-056 fluxo de tradução em três etapas', () => {
    const validated = (value: LocalMediaImportDraft): LocalMediaImportDraft => ({
        ...value,
        items: value.items.map(item => ({
            ...item,
            mediaValidationStatus: 'VALID',
            detectedMimeType: 'image/png',
            widthPx: 100,
            heightPx: 200,
            validatedAt: 9,
            validationPolicyVersion: 1,
        })),
    });
    const prepared = (createdAt: number): TranslationProject => ({
        id: 'project-new',
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        status: 'DRAFT',
        createdAt,
        updatedAt: createdAt,
        statusUpdatedAt: createdAt,
        languageReviewRequired: false,
        pages: [],
    });
    const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

    beforeEach(async () => {
        mockReplace.mockClear();
        await i18n.changeLanguage('pt-BR');
    });

    it('AC-004 a ação principal de cada etapa fica no rodapé fixo', async () => {
        renderPage(controller({ initialize: jest.fn().mockResolvedValue(draft) }));
        await screen.findByTestId('translation-flow-step-organize');
        const footer = screen.getByTestId('page-container-sticky-footer');
        await waitFor(() => expect(within(footer).getByRole('button', { name: 'Confirmar ordem' })).toBeOnTheScreen());
    });

    it('AC-003/AC-005 valida sozinho depois dos idiomas e voltar leva à etapa Páginas', async () => {
        const validator = validationController();
        renderPage(
            controller({ initialize: jest.fn().mockResolvedValue({ ...draft, confirmedAt: 9, languagesConfirmedAt: 9 }) }),
            reviewController(),
            validator,
        );
        await screen.findByTestId('translation-flow-step-validate');
        expect(screen.getByTestId('step-bar')).toHaveProp('accessibilityLabel', 'Etapa 2 de 3: Idiomas');
        await waitFor(() => expect(validator.validate).toHaveBeenCalledTimes(1));
        fireEvent.press(screen.getByRole('button', { name: 'Etapa anterior' }));
        expect(await screen.findByTestId('translation-flow-step-organize')).toBeOnTheScreen();
        expect(screen.getByTestId('step-bar')).toHaveProp('accessibilityLabel', 'Etapa 1 de 3: Páginas');
    });

    it('abre a correção com a galeria acessível ao encontrar uma página inválida', async () => {
        const confirmed = { ...draft, confirmedAt: 9, languagesConfirmedAt: 9 };
        const validator = validationController();
        jest.mocked(validator.validate).mockResolvedValue({
            ...confirmed,
            items: [{ ...confirmed.items[0], mediaValidationStatus: 'INVALID', mediaValidationError: 'CORRUPTED' }, confirmed.items[1]],
        });
        renderPage(controller({ initialize: jest.fn().mockResolvedValue(confirmed) }), reviewController(), validator);

        const summary = within(await screen.findByTestId('validation-issue-summary'));
        fireEvent.press(summary.getByRole('button', { name: 'Ir para correção' }));

        expect(screen.getByTestId('page-container-fixed-frame')).toBeOnTheScreen();
        expect(screen.getByTestId('validation-thumbnail-item-1')).toBeOnTheScreen();
        expect(screen.queryByText('Confirme os idiomas')).toBeNull();
        expect(screen.queryByText('Editar páginas')).toBeNull();
    });

    it('AC-012 "Salvar em" escolhe a obra antes de traduzir e refaz o vínculo quando ele falha', async () => {
        const project = prepared(Date.now() + 1000);
        const attach = jest.fn().mockRejectedValueOnce(new Error('db')).mockResolvedValue(undefined);
        const projects = { initialize: jest.fn().mockResolvedValueOnce(null).mockResolvedValue(project), prepare: jest.fn().mockResolvedValue(project) };
        const works = {
            attachProjectToWork: attach,
            initialize: jest.fn(async () => [{ id: 'w1', name: 'Óbra A', coverFilename: null, createdAt: 1, updatedAt: 1 }]),
            listChapters: jest.fn(async () => [
                { projectId: 'a', workId: 'w1', label: '1', createdAt: 1, updatedAt: 1 },
                { projectId: 'b', workId: 'w1', label: '2', createdAt: 1, updatedAt: 1 },
            ]),
        };
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <OfflineTranslationPage
                    importController={controller({
                        initialize: jest
                            .fn()
                            .mockResolvedValueOnce(validated({ ...draft, confirmedAt: 9, languagesConfirmedAt: 9 }))
                            .mockResolvedValue(null),
                    })}
                    reviewController={reviewController()}
                    validationController={validationController()}
                    projectController={projects}
                    worksController={works}
                />
            </SafeAreaProvider>,
        );
        expect(await screen.findByTestId('translation-flow-step-review')).toBeOnTheScreen();
        expect(screen.getByText(/Salvar em: Sem obra/)).toBeOnTheScreen();
        expect(screen.getByTestId('save-destination-cover')).toHaveProp('source', { uri: 'file:///private/draft-1/item-1' });
        fireEvent.press(screen.getByTestId('save-destination'));
        await screen.findByRole('radio', { name: 'Óbra A' });
        const search = screen.getByLabelText('Buscar obras');
        // revisão 2026-11-13: no visible label repeating the placeholder, and the works under their own heading.
        expect(screen.queryByText('Buscar obras')).toBeNull();
        expect(screen.getByRole('header', { name: 'Suas obras' })).toBeOnTheScreen();
        fireEvent.changeText(search, '  OBRA  ');
        fireEvent.press(screen.getByText('Óbra A'));
        expect(screen.getByRole('radio', { name: 'Óbra A' })).toBeChecked();
        fireEvent.changeText(search, 'ausente');
        expect(screen.getByText('Nenhuma obra encontrada.')).toBeOnTheScreen();
        fireEvent.changeText(search, '');
        expect(screen.getByRole('radio', { name: 'Óbra A' })).toBeChecked();
        await waitFor(() => expect(screen.getByLabelText('Número ou nome do capítulo')).toHaveProp('value', '3'));
        fireEvent.press(screen.getByRole('button', { name: 'Usar esta obra' }));
        expect(await screen.findByText(/Salvar em: Óbra A/)).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Traduzir 2 páginas' }));
        await waitFor(() => expect(attach).toHaveBeenCalledWith('w1', 'project-new', '3'));
        fireEvent.press(await screen.findByRole('button', { name: 'Tentar vincular de novo' }));
        await waitFor(() => expect(attach).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.queryByText('O capítulo foi preparado, mas não entrou na obra.')).toBeNull());
    });

    it('keeps all the selected images in the virtualized summary in page order', () => {
        const items = Array.from({ length: 33 }, (_, position) => ({ ...draft.items[0], id: `item-${position}`, position }));
        const { UNSAFE_getByType } = render(
            <FlowSummary draft={{ ...draft, items }} languages="Japonês → Português" itemUri={item => `file:///draft/${item.id}`} onEditPages={jest.fn()} />,
        );
        const list = UNSAFE_getByType(FlatList);
        expect(list.props.horizontal).toBe(true);
        expect(list.props.showsHorizontalScrollIndicator).toBe(false);
        expect(list.props.windowSize).toBe(3);
        expect(list.props.data).toEqual(items);
    });

    it('AC-009 a demonstração não aparece fora de __DEV__', async () => {
        const previous = (global as { __DEV__?: boolean }).__DEV__;
        (global as { __DEV__?: boolean }).__DEV__ = false;
        try {
            renderPage(controller(), reviewController(), validationController(), { initialize: jest.fn(async () => prepared(10)), prepare: jest.fn() });
            fireEvent.press(await screen.findByRole('button', { name: 'Retomar último capítulo' }));
            await screen.findByTestId('translation-flow-step-review');
            expect(screen.queryByRole('button', { name: 'Gerar resultado de demonstração' })).toBeNull();
        } finally {
            (global as { __DEV__?: boolean }).__DEV__ = previous;
        }
    });
});
