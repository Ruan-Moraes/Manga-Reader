import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft } from '@/entities/local-media-import';
import { type TranslationProject } from '@/entities/translation-project';
import { type CreateTranslationProjectController, CreateTranslationProjectPanel } from '@/features/create-translation-project';
import { ImportLocalMediaPanel, type LocalMediaImportController, localMediaImportController } from '@/features/import-local-media';
import { GenerateDemoTranslationPanel, openLocalTranslationResultController } from '@/features/local-translation';
import { type ManageLocalWorksController, manageLocalWorksController } from '@/features/manage-local-works';
import { LocalMediaReviewPanel, type ReviewLocalMediaImportController, reviewLocalMediaImportController } from '@/features/review-local-media-import';
import { type SelectTranslationLanguagesController, TranslationLanguageSelectionPanel } from '@/features/select-translation-languages';
import { LocalMediaValidationItemStatus, LocalMediaValidationPanel, type ValidateLocalMediaController } from '@/features/validate-local-media';
import { useDeveloperModeEnabled } from '@/shared/config';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';
import { navigateBackOrReplace, ROUTES, useLeaveGuard } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import {
    ActionSlotOutlet,
    ActionSlotProvider,
    AppText,
    BottomSheet,
    Button,
    CenterDialog,
    ConfirmDialog,
    DialogAction,
    IconButton,
    PrimaryAction,
    ScreenScaffold,
    showToast,
    StatusMessage,
    StepBar,
    StickyActionBar,
    TextAction,
} from '@/shared/ui';
import { ChapterBatchPanel } from '@/widgets/remote-processing';

import {
    availableTranslationFlowStep,
    previousTranslationFlowStep,
    TRANSLATION_FLOW_STAGES,
    translationFlowStage,
    type TranslationFlowStep,
    visibleTranslationFlowStep,
} from '../model/translationFlow';
import { FlowSummary } from './FlowSummary';
import { type ChapterDestination, SaveDestination } from './SaveDestination';

interface Props {
    importController?: LocalMediaImportController;
    reviewController?: ReviewLocalMediaImportController;
    languageController?: SelectTranslationLanguagesController;
    validationController?: ValidateLocalMediaController;
    projectController?: CreateTranslationProjectController;
    workTarget?: { workId: string; label: string } | null;
    worksController?: Pick<ManageLocalWorksController, 'attachProjectToWork' | 'initialize' | 'listChapters'>;
}

export function OfflineTranslationRoute() {
    const params = useLocalSearchParams<{ workId?: string; label?: string }>();
    const workId = typeof params.workId === 'string' ? params.workId : '';
    const label = typeof params.label === 'string' ? params.label.trim() : '';
    return <OfflineTranslationPage workTarget={workId && label ? { workId, label } : null} />;
}

export function OfflineTranslationPage({
    importController,
    reviewController,
    languageController,
    validationController,
    projectController,
    workTarget = null,
    worksController = manageLocalWorksController,
}: Props) {
    const { t, i18n } = useTranslation('launcher');
    const developerModeEnabled = useDeveloperModeEnabled();
    const { spacing } = useTheme();
    const [draft, setDraft] = useState<LocalMediaImportDraft | null>(null);
    const [requestedStep, setRequestedStep] = useState<TranslationFlowStep | null>(null);
    const [preparedProject, setPreparedProject] = useState<TranslationProject | null>(null);
    const [remoteBusy, setRemoteBusy] = useState(false);
    const [chapterLinkFailed, setChapterLinkFailed] = useState(false);
    const [resumed, setResumed] = useState(false);
    const [destination, setDestination] = useState<ChapterDestination | null>(
        workTarget ? { workId: workTarget.workId, workName: '', label: workTarget.label } : null,
    );
    const destinationRef = useRef(destination);
    destinationRef.current = destination;
    const mountedAt = useRef(Date.now());
    const linkedProjects = useRef(new Set<string>());
    // Saída e descarte (2026-11-10): nenhuma etapa prende o usuário; sair com páginas escolhidas pergunta se mantém o
    // rascunho ou descarta, e o voltar do sistema segue a mesma regra do voltar da tela.
    const [exitTarget, setExitTarget] = useState<'back' | 'home' | null>(null);
    const [restartOpen, setRestartOpen] = useState(false);
    const [draftPromptOpen, setDraftPromptOpen] = useState(false);
    const [importKey, setImportKey] = useState(0);
    const draftChecked = useRef(false);

    useEffect(() => {
        if (!workTarget) return;
        void worksController
            .initialize()
            .then(works => {
                const work = works.find(item => item.id === workTarget.workId);
                if (work) setDestination(current => (current && current.workId === work.id ? { ...current, workName: work.name } : current));
            })
            .catch(() => undefined);
    }, [workTarget, worksController]);

    const link = useCallback(
        (project: TranslationProject) => {
            const target = destinationRef.current;
            if (!target) return;
            linkedProjects.current.add(project.id);
            setChapterLinkFailed(false);
            void worksController.attachProjectToWork(target.workId, project.id, target.label).catch(() => {
                linkedProjects.current.delete(project.id);
                setChapterLinkFailed(true);
            });
        },
        [worksController],
    );
    const handleProjectChange = useCallback(
        (project: TranslationProject | null) => {
            const fresh = !!project && project.createdAt >= mountedAt.current;
            // Com obra de destino a intenção é um capítulo novo: um projeto anterior restaurado não vale como resultado.
            setPreparedProject(!!workTarget && project && !fresh ? null : project);
        },
        [workTarget],
    );
    // Os painéis também emitem o último projeto salvo ao montar; só vincula o criado desde que a tela abriu,
    // assim que houver projeto novo e destino escolhido (em qualquer ordem).
    useEffect(() => {
        if (!preparedProject || preparedProject.createdAt < mountedAt.current || !destination) return;
        if (linkedProjects.current.has(preparedProject.id)) return;
        link(preparedProject);
    }, [destination, link, preparedProject]);
    const handleDraftChange = useCallback(
        (nextDraft: LocalMediaImportDraft | null) => {
            // Entrando por "Novo capítulo" com uma seleção antiga guardada: perguntar antes de usar essas páginas.
            if (!draftChecked.current) {
                draftChecked.current = true;
                if (workTarget && nextDraft && nextDraft.createdAt < mountedAt.current) setDraftPromptOpen(true);
            }
            setDraft(nextDraft);
        },
        [workTarget],
    );
    const handleValidationDraftChange = useCallback((nextDraft: LocalMediaImportDraft) => {
        setDraft(nextDraft);
        if (isMediaValidationReady(nextDraft, MEDIA_VALIDATION_POLICY_VERSION)) setRequestedStep('validate');
    }, []);
    const preparedNow = !!preparedProject && preparedProject.createdAt >= mountedAt.current;
    const showPrepared = !draft && !!preparedProject && (preparedNow || resumed);
    const availableStep = availableTranslationFlowStep(draft);
    const currentStep: TranslationFlowStep = showPrepared ? 'review' : !draft ? 'import' : visibleTranslationFlowStep(availableStep, requestedStep);
    const stage = translationFlowStage(currentStep);
    const stageIndex = TRANSLATION_FLOW_STAGES.indexOf(stage);
    const stageLabels = useMemo(() => TRANSLATION_FLOW_STAGES.map(id => t(`offline.flow3.steps.${id}`)), [t]);

    useEffect(() => {
        setRequestedStep(requested => (availableStep === 'review' && requested === 'validate' ? requested : null));
    }, [availableStep]);

    const openReader = (projectId: string) => router.push({ pathname: ROUTES.TRANSLATION_READER, params: { projectId } } as never);
    const languagePair = (source: string, target: string) =>
        t('offline.flow3.summaryLanguages', { source: t(`offline.languages.options.${source}`), target: t(`offline.languages.options.${target}`) });

    const exitTo = (target: 'back' | 'home') => {
        allowLeave();
        if (target === 'home') {
            router.replace(ROUTES.ROOT as never);
            return;
        }
        // Volta para onde o fluxo foi aberto (obra, biblioteca ou módulos), sem empilhar telas.
        navigateBackOrReplace(workTarget ? `/work/${workTarget.workId}` : ROUTES.ROOT);
    };
    const requestLeave = (target: 'back' | 'home') => {
        if (remoteBusy || (draft && !showPrepared)) {
            setExitTarget(target);
            return;
        }
        exitTo(target);
    };
    const discardSelection = async () => {
        try {
            await (importController ?? localMediaImportController).discard?.();
        } catch {
            showToast({ tone: 'danger', title: t('offline.import.errors.storage-unavailable') });
            return false;
        }
        setDraft(null);
        setRequestedStep(null);
        setImportKey(key => key + 1);
        showToast({ tone: 'success', title: t('offline.flow.discarded') });
        return true;
    };

    const goBack = () => {
        if (showPrepared) {
            requestLeave('back');
            return;
        }
        const previous = previousTranslationFlowStep(currentStep);
        if (previous && draft) {
            setRequestedStep(previous);
            return;
        }
        requestLeave('back');
    };
    const { allowLeave } = useLeaveGuard(!!draft || remoteBusy, goBack);

    const latestProjectProbe = (
        // O painel emite o último projeto salvo; ele fica oculto e só alimenta o link "Retomar último capítulo".
        <View style={{ display: 'none' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <CreateTranslationProjectPanel
                key="latest-project"
                draft={null}
                onDraftConsumed={() => setDraft(null)}
                controller={projectController}
                onProjectChange={handleProjectChange}
            />
        </View>
    );

    const correctingPages = !showPrepared && currentStep === 'validate' && draft?.items.some(item => item.mediaValidationStatus === 'INVALID');
    const chapterCoverUri = () => {
        try {
            if (showPrepared && preparedProject) {
                return openLocalTranslationResultController.originalUri(preparedProject, 0);
            }
            const first = draft?.items.find(item => item.position === 0);
            return draft && first ? (reviewController ?? reviewLocalMediaImportController).itemUri(draft, first) : null;
        } catch {
            return null;
        }
    };
    const content = (() => {
        if (showPrepared && preparedProject) {
            return (
                <View style={{ flex: 1, minHeight: 0, gap: spacing.md }}>
                    {preparedProject.status !== 'DRAFT' ? (
                        // Projeto retomado já processado (012): não dizer que o processamento ainda não começou.
                        <StatusMessage tone="success" title={t('offline.project.preparedRetainedDescription')} />
                    ) : null}
                    {chapterLinkFailed ? (
                        <StatusMessage
                            tone="danger"
                            title={t('offline.flow3.linkFailed')}
                            actionLabel={t('offline.flow3.linkRetry')}
                            onAction={() => link(preparedProject)}
                        />
                    ) : null}
                    <ChapterBatchPanel
                        projectId={preparedProject.id}
                        headerContent={
                            <SaveDestination
                                destination={destination}
                                coverUri={chapterCoverUri()}
                                chapterTitle={t('offline.flow3.chapterOf', { date: new Intl.DateTimeFormat(i18n.language).format(Date.now()) })}
                                languages={languagePair(preparedProject.sourceLanguage, preparedProject.targetLanguage)}
                                // Antes de enviar, o destino ainda pode mudar; depois do vínculo ou durante o envio, fica fixo.
                                locked={remoteBusy || linkedProjects.current.has(preparedProject.id)}
                                controller={worksController}
                                onChange={setDestination}
                            />
                        }
                        onActivityChange={setRemoteBusy}
                        onOpenReader={openReader}
                        requestStart={preparedNow}
                        renderLayout={(content, footer) => (
                            <>
                                {content}
                                {footer ? <PrimaryAction>{footer}</PrimaryAction> : null}
                            </>
                        )}
                    />
                    {__DEV__ && developerModeEnabled ? (
                        <GenerateDemoTranslationPanel
                            project={preparedProject}
                            onGenerated={project => router.push({ pathname: ROUTES.TRANSLATION_READER, params: { projectId: project.id } } as never)}
                        />
                    ) : null}
                </View>
            );
        }
        if (currentStep === 'import') {
            return (
                <View style={{ gap: spacing.md }}>
                    {!draft ? latestProjectProbe : null}
                    <ImportLocalMediaPanel
                        key={importKey}
                        controller={importController}
                        draft={draft}
                        footerSelect
                        onDraftChange={handleDraftChange}
                        onContinue={() => {
                            if (draft && draft.items.length > 0) setRequestedStep('organize');
                        }}
                    />
                    {!draft && preparedProject ? (
                        <TextAction icon="time-outline" iconTile align="center" label={t('offline.flow3.resume')} onPress={() => setResumed(true)} />
                    ) : null}
                </View>
            );
        }
        if (!draft) return null;
        if (currentStep === 'organize') {
            return (
                <LocalMediaReviewPanel
                    draft={draft}
                    onDraftChange={handleDraftChange}
                    controller={reviewController}
                    renderItemMeta={item => <LocalMediaValidationItemStatus item={item} />}
                    onContinue={() => setRequestedStep(null)}
                    onRestart={() => setRestartOpen(true)}
                />
            );
        }
        if (currentStep === 'languages' || currentStep === 'validate') {
            return (
                <View style={{ flex: 1, gap: spacing.md, minHeight: 0 }}>
                    {correctingPages ? null : (
                        <>
                            <TranslationLanguageSelectionPanel
                                draft={draft}
                                onDraftChange={handleDraftChange}
                                controller={languageController}
                                hideConfirmedState
                            />
                            <FlowSummary
                                draft={draft}
                                languages={languagePair(draft.sourceLanguage, draft.targetLanguage)}
                                itemUri={item => (reviewController ?? reviewLocalMediaImportController).itemUri(draft, item)}
                                onEditPages={() => setRequestedStep('organize')}
                            />
                        </>
                    )}
                    {!draft.languagesConfirmedAt ? (
                        <AppText variant="caption" tone="subtle" style={{ marginHorizontal: spacing.xs }}>
                            {t('offline.flow3.confirmOnContinue')}
                        </AppText>
                    ) : null}
                    {draft.languagesConfirmedAt ? (
                        <LocalMediaValidationPanel
                            autoStart
                            issuesOnly
                            draft={draft}
                            onDraftChange={handleValidationDraftChange}
                            onContinue={() => setRequestedStep('review')}
                            controller={validationController}
                            onRemoveItem={async item => {
                                // Removing changes the page order, so the pages screen asks to confirm it again.
                                const outcome = await (reviewController ?? reviewLocalMediaImportController).removeItem(draft, item.id);
                                handleDraftChange(outcome.status === 'cleared' ? null : outcome.draft);
                            }}
                        />
                    ) : null}
                </View>
            );
        }
        return (
            <View style={{ gap: spacing.md }}>
                <SaveDestination
                    destination={destination}
                    coverUri={chapterCoverUri()}
                    chapterTitle={t('offline.flow3.chapterOf', { date: new Intl.DateTimeFormat(i18n.language).format(Date.now()) })}
                    languages={languagePair(draft.sourceLanguage, draft.targetLanguage)}
                    locked={remoteBusy}
                    controller={worksController}
                    onChange={setDestination}
                />
                <CreateTranslationProjectPanel
                    key="prepare-project"
                    draft={draft}
                    onDraftConsumed={project => {
                        // Mesmo render: sem rascunho e já com o projeto, para não piscar a etapa 1 antes do lote.
                        handleProjectChange(project);
                        setDraft(null);
                    }}
                    controller={projectController}
                    onProjectChange={handleProjectChange}
                    actionLabel={t('offline.flow3.translatePages', { count: draft.items.length })}
                    bare
                />
            </View>
        );
    })();

    const fixedLayout = showPrepared || currentStep === 'organize' || correctingPages;
    return (
        <ActionSlotProvider>
            <ScreenScaffold
                compact
                scroll={!fixedLayout}
                contentBottomSpacing={!showPrepared && currentStep === 'organize' ? 0 : undefined}
                title={t('offline.pageTitle')}
                backShape="control"
                backLabel={!showPrepared && draft && previousTranslationFlowStep(currentStep) ? t('offline.flow.back') : t('offline.flow.backPlain')}
                onBack={goBack}
                belowHeader={
                    <StepBar steps={stageLabels} currentIndex={stageIndex} counterLabel={t('offline.flow3.counter', { current: stageIndex + 1, total: 3 })} />
                }
                headerAction={
                    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                        {draft && !showPrepared ? (
                            <IconButton accessibilityLabel={t('offline.flow.cancel')} icon="close" onPress={() => setExitTarget('back')} />
                        ) : null}
                        <IconButton accessibilityLabel={t('navigation.home')} icon="home-outline" onPress={() => requestLeave('home')} />
                    </View>
                }
                stickyFooter={
                    <StickyActionBar>
                        <ActionSlotOutlet />
                    </StickyActionBar>
                }
            >
                <View style={{ gap: spacing.sm }}>
                    <AppText accessibilityRole="header" variant="title">
                        {correctingPages ? t('offline.validation.issueSummaryTitle') : t(`offline.flow3.title.${stage}`)}
                    </AppText>
                    {stage === 'translate' || correctingPages ? null : (
                        <AppText tone="muted">
                            {stage === 'pages'
                                ? t(draft?.items.length ? 'offline.flow3.description.organize' : 'offline.flow3.description.import')
                                : t(`offline.flow3.hint.${stage}`)}
                        </AppText>
                    )}
                </View>
                <View testID={`translation-flow-step-${currentStep}`} style={{ flex: 1, minHeight: 0 }}>
                    {content}
                </View>
            </ScreenScaffold>
            {remoteBusy ? (
                <CenterDialog
                    visible={exitTarget !== null}
                    onClose={() => setExitTarget(null)}
                    closeLabel={t('offline.flow.exitCancel')}
                    icon="warning-outline"
                    tone="warning"
                    title={t('offline.flow.exitTitle')}
                    description={t('offline.flow.exitDescription')}
                    testIDs={{ card: 'flow-exit-dialog' }}
                    actions={
                        <>
                            <DialogAction>
                                <Button variant="outline" onPress={() => setExitTarget(null)}>
                                    {t('offline.flow.exitCancel')}
                                </Button>
                            </DialogAction>
                            <DialogAction>
                                <Button tone="danger" onPress={() => exitTo(exitTarget ?? 'back')}>
                                    {t('offline.flow.exitConfirm')}
                                </Button>
                            </DialogAction>
                        </>
                    }
                />
            ) : (
                <BottomSheet
                    visible={exitTarget !== null}
                    onClose={() => setExitTarget(null)}
                    closeLabel={t('platform.closeSheet')}
                    title={t('offline.flow.leaveTitle')}
                    description={t('offline.flow.leaveDescription')}
                    testIDs={{ sheet: 'flow-exit-sheet', scroll: 'flow-exit-actions' }}
                >
                    <View style={{ gap: spacing.sm }}>
                        <Button onPress={() => exitTo(exitTarget ?? 'back')}>{t('offline.flow.leaveKeep')}</Button>
                        <Button variant="outline" onPress={() => setExitTarget(null)}>
                            {t('offline.flow.leaveStay')}
                        </Button>
                        <View style={{ paddingTop: spacing.xs }}>
                            <Button
                                tone="danger"
                                variant="ghost"
                                onPress={() => {
                                    const target = exitTarget ?? 'back';
                                    setExitTarget(null);
                                    void discardSelection().then(ok => ok && exitTo(target));
                                }}
                            >
                                {t('offline.flow.leaveDiscard')}
                            </Button>
                        </View>
                    </View>
                </BottomSheet>
            )}
            <ConfirmDialog
                visible={restartOpen}
                onClose={() => setRestartOpen(false)}
                onConfirm={() => void discardSelection()}
                closeLabel={t('offline.flow.restartKeep')}
                cancelLabel={t('offline.flow.restartKeep')}
                confirmLabel={t('offline.flow.restartConfirm')}
                title={t('offline.flow.restartTitle')}
                description={t('offline.flow.restartDescription', { count: draft?.items.length ?? 0 })}
                icon="trash-outline"
            />
            <CenterDialog
                visible={draftPromptOpen}
                onClose={() => setDraftPromptOpen(false)}
                closeLabel={t('offline.flow.draftKeep')}
                icon="images-outline"
                title={t('offline.flow.draftTitle')}
                description={t('offline.flow.draftDescription', { count: draft?.items.length ?? 0 })}
                testIDs={{ card: 'flow-draft-dialog' }}
                actions={
                    <>
                        <DialogAction>
                            <Button
                                variant="outline"
                                onPress={() => {
                                    setDraftPromptOpen(false);
                                    void discardSelection();
                                }}
                            >
                                {t('offline.flow.draftDiscard')}
                            </Button>
                        </DialogAction>
                        <DialogAction>
                            <Button onPress={() => setDraftPromptOpen(false)}>{t('offline.flow.draftKeep')}</Button>
                        </DialogAction>
                    </>
                }
            />
        </ActionSlotProvider>
    );
}
