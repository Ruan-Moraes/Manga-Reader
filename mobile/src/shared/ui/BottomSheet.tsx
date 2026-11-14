import { useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { createShadowStyle, useTheme } from '@/shared/theme';

import { PanelHeader } from './PanelHeader';
import { useKeyboardOverlap } from './useKeyboardInset';

export const BOTTOM_SHEET_DEFAULT_MAX_RATIO = 0.85;
const HANDLE_AREA_HEIGHT = 24;

/** MOB-FEAT-070: soltar além desta fração da altura fecha a folha. */
export const SHEET_DRAG_CLOSE_RATIO = 0.3;
/** MOB-FEAT-070: soltar com velocidade para baixo acima desta (pt/s) fecha a folha, mesmo antes do limite. */
export const SHEET_DRAG_CLOSE_VELOCITY = 800;
/** Para cima a folha só resiste: anda uma fração do dedo, até este limite. */
const SHEET_DRAG_UP_RESISTANCE = 0.2;
const SHEET_DRAG_UP_LIMIT = 24;
/** Deslocamento vertical antes de o gesto ativar, para não roubar o toque no X do cabeçalho. */
const SHEET_DRAG_ACTIVATION = 8;

// Curvas da escala de movimento (MOTION_EASING) no Easing do Reanimated, que roda na UI thread.
const SHEET_EASING = { enter: Easing.out(Easing.cubic), exit: Easing.in(Easing.cubic), standard: Easing.out(Easing.quad) };

export interface BottomSheetTestIDs {
    layer: string;
    backdrop: string;
    sheet: string;
    handle: string;
    header: string;
    scroll: string;
    footer: string;
    drag: string;
}

const DEFAULT_TEST_IDS: BottomSheetTestIDs = {
    layer: 'bottom-sheet-layer',
    backdrop: 'bottom-sheet-backdrop',
    sheet: 'bottom-sheet',
    handle: 'bottom-sheet-handle',
    header: 'bottom-sheet-header',
    scroll: 'bottom-sheet-scroll',
    footer: 'bottom-sheet-footer',
    drag: 'bottom-sheet-drag',
};

/**
 * Espaço sob a ação do rodapé das folhas: a safe area menos 16 (a barra de início ocupa só os ~13 pt finais), nunca
 * menos que 8; sem safe area, 16. Mantém a ação colada embaixo sem invadir a área do gesto.
 */
export function resolveSheetFooterBottom(insetBottom: number, spacing: { sm: number; md: number }): number {
    // 2026-11-14: nunca menos de `md` abaixo da ação; antes podia cair para 8 e colar no fim da tela.
    return Math.max(insetBottom - spacing.sm, spacing.md);
}

export interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Accessible label of the close button and of the scrim. */
    closeLabel: string;
    title?: string;
    description?: string;
    headerMetadata?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    scroll?: boolean;
    /** Fixed height computed by the consumer; still limited by `maxHeightRatio`. */
    height?: number;
    maxHeightRatio?: number;
    onShow?: () => void;
    onDismiss?: () => void;
    /**
     * Called once the sheet has fully left the screen and another modal can be presented: on iOS when the Modal reports
     * it was dismissed, elsewhere when the exit animation ends.
     */
    onClosed?: () => void;
    testIDs?: Partial<BottomSheetTestIDs>;
}

/** Clamps the sheet height to the safe viewport; never negative. */
export function resolveBottomSheetMaxHeight(viewportHeight: number, safeTop: number, ratio = BOTTOM_SHEET_DEFAULT_MAX_RATIO): number {
    const height = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
    const top = Number.isFinite(safeTop) ? Math.max(0, safeTop) : 0;
    const safeRatio = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : BOTTOM_SHEET_DEFAULT_MAX_RATIO;

    return Math.max(0, height - top) * safeRatio;
}

export function BottomSheet({
    visible,
    onClose,
    closeLabel,
    title,
    description,
    headerMetadata,
    footer,
    children,
    scroll = true,
    height,
    maxHeightRatio = BOTTOM_SHEET_DEFAULT_MAX_RATIO,
    onShow,
    onDismiss,
    onClosed,
    testIDs,
}: BottomSheetProps) {
    const { height: viewportHeight } = useWindowDimensions();

    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };

    const { effectiveReduceMotion, layout, motion, radii, spacing, tokens } = useTheme();

    const ids = { ...DEFAULT_TEST_IDS, ...testIDs };
    // Teclado aberto: a folha sobe por cima dele e encolhe para caber no espaço livre; o corpo rola e o rodapé
    // (a ação) fica sempre visível acima do teclado.
    const { overlap: keyboard, onLayerLayout } = useKeyboardOverlap();
    const maxHeight = Math.min(
        resolveBottomSheetMaxHeight(viewportHeight, insets.top, maxHeightRatio),
        keyboard > 0 ? Math.max(0, viewportHeight - insets.top - keyboard - spacing.md) : Number.POSITIVE_INFINITY,
    );
    const bottomPadding = keyboard > 0 ? spacing.lg : Math.max(insets.bottom, spacing.lg);
    const footerBottomPadding = keyboard > 0 ? spacing.sm : resolveSheetFooterBottom(insets.bottom, spacing);
    const shadow = createShadowStyle('sheet', tokens.overlay);

    // Animação própria (pedido de 2026-11-09): o fundo escuro só faz fade; apenas a folha sobe e desce.
    // O Modal segue montado até a saída terminar; com redução de movimento tudo é instantâneo.
    // MOB-FEAT-070: a posição da folha (`offset`, em pt abaixo da posição aberta) é um valor do Reanimated, para a
    // animação e o gesto de arrastar moverem a mesma coisa na UI thread, sem pular de posição.
    const [mounted, setMounted] = useState(visible);
    // Só avisa o fechamento de uma folha que chegou a abrir; a montagem inicial invisível não conta.
    const shown = useRef(visible);
    const onClosedRef = useRef(onClosed);
    onClosedRef.current = onClosed;
    const finishClose = (fromModal: boolean) => {
        if (!shown.current || (Platform.OS === 'ios') !== fromModal) return;
        shown.current = false;
        onClosedRef.current?.();
    };
    const finishCloseRef = useRef(finishClose);
    finishCloseRef.current = finishClose;
    // A folha sobe a própria altura medida, não a altura máxima: antes, numa folha baixa, o começo da subida (a parte
    // mais rápida da curva) acontecia fora da tela e a entrada parecia atrasada. A entrada só começa depois que a folha
    // foi desenhada e medida dentro do Modal, para não perder os primeiros quadros (desempenho, 2026-11-14).
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
    const travel = measuredHeight ?? (height === undefined ? maxHeight : Math.min(Math.max(0, height), maxHeight));
    const ready = measuredHeight !== null;
    const offset = useSharedValue(travel);
    const sheetHeight = useSharedValue(travel);
    sheetHeight.value = travel;
    const entered = useRef(false);
    const onSheetLayout = (event: LayoutChangeEvent) => {
        const next = Math.ceil(event.nativeEvent.layout.height);
        setMeasuredHeight(previous => (previous === next ? previous : next));
    };
    useEffect(() => {
        if (!mounted && !visible) setMeasuredHeight(null);
    }, [mounted, visible]);
    const finishExit = () => {
        setMounted(false);
        finishCloseRef.current(false);
    };
    const finishExitRef = useRef(finishExit);
    finishExitRef.current = finishExit;
    const onExitDone = () => finishExitRef.current();
    useEffect(() => {
        if (visible) {
            setMounted(true);
            shown.current = true;
        }
        if (effectiveReduceMotion) {
            offset.value = visible ? 0 : travel;
            entered.current = visible;
            if (!visible) finishExitRef.current();
            return;
        }
        if (visible) {
            // Abrindo: espera a primeira medição e parte exatamente da própria altura.
            if (!ready) return;
            if (!entered.current) offset.value = travel;
            entered.current = true;
            offset.value = withTiming(0, { duration: motion.sheet, easing: SHEET_EASING.enter });
            return;
        }
        // Fechando: sai na hora, a partir de onde estiver (inclusive no meio de um arrasto).
        entered.current = false;
        offset.value = withTiming(travel, { duration: motion.exit, easing: SHEET_EASING.exit }, finished => {
            if (finished) scheduleOnRN(onExitDone);
        });
        // `travel` muda com o teclado; a folha aberta não precisa reagir a isso, só a próxima abertura ou saída.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveReduceMotion, motion.exit, motion.sheet, ready, visible]);

    // MOB-FEAT-070: arrastar a alça ou o cabeçalho para baixo fecha a folha pelo mesmo `onClose` do X.
    const visibleRef = useRef(visible);
    visibleRef.current = visible;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const backDuration = motion.base;
    const settle = () => {
        offset.value = withTiming(0, { duration: backDuration, easing: SHEET_EASING.standard });
    };
    const closeFromDrag = () => {
        Keyboard.dismiss();
        onCloseRef.current();
        // Quem fecha pode recusar (pedir confirmação antes de descartar): a folha volta para a posição aberta.
        setTimeout(() => {
            if (visibleRef.current) settle();
        }, 0);
    };
    const drag = Gesture.Pan()
        .withTestId(ids.drag)
        .enabled(visible)
        .activeOffsetY([-SHEET_DRAG_ACTIVATION, SHEET_DRAG_ACTIVATION])
        .onUpdate(event => {
            offset.value = event.translationY < 0 ? Math.max(-SHEET_DRAG_UP_LIMIT, event.translationY * SHEET_DRAG_UP_RESISTANCE) : event.translationY;
        })
        .onEnd(event => {
            if (offset.value > sheetHeight.value * SHEET_DRAG_CLOSE_RATIO || event.velocityY > SHEET_DRAG_CLOSE_VELOCITY) {
                scheduleOnRN(closeFromDrag);
                return;
            }
            offset.value = withTiming(0, { duration: backDuration, easing: SHEET_EASING.standard });
        })
        .onFinalize((_event, success) => {
            // Arrasto interrompido pelo sistema: volta para a posição aberta.
            if (!success && offset.value !== 0) offset.value = withTiming(0, { duration: backDuration, easing: SHEET_EASING.standard });
        });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: sheetHeight.value > 0 ? Math.min(1, Math.max(0, 1 - offset.value / sheetHeight.value)) : 0,
    }));
    const sheetMotionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

    return (
        <Modal
            animationType="none"
            navigationBarTranslucent
            onDismiss={() => {
                onDismiss?.();
                finishClose(true);
            }}
            onShow={onShow}
            onRequestClose={onClose}
            presentationStyle="overFullScreen"
            statusBarTranslucent
            transparent
            visible={mounted || visible}
        >
            {/* O gesture-handler precisa da própria raiz dentro do Modal no Android (MOB-FEAT-070). */}
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View
                    accessibilityViewIsModal={visible}
                    accessibilityElementsHidden={!visible}
                    importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
                    onAccessibilityEscape={onClose}
                    onLayout={onLayerLayout}
                    pointerEvents={visible ? 'auto' : 'none'}
                    style={{ flex: 1 }}
                    testID={ids.layer}
                >
                    <Reanimated.View pointerEvents="box-none" style={[{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, backdropStyle]}>
                        <Pressable
                            testID={ids.backdrop}
                            accessibilityLabel={closeLabel}
                            accessibilityRole="button"
                            onPress={onClose}
                            style={{ backgroundColor: tokens.scrim, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                        />
                    </Reanimated.View>
                    <Reanimated.View
                        testID={ids.sheet}
                        onLayout={onSheetLayout}
                        style={[
                            {
                                backgroundColor: tokens.surface,
                                borderColor: tokens.separator,
                                borderTopLeftRadius: radii.feature,
                                borderTopRightRadius: radii.feature,
                                borderTopWidth: 1,
                                bottom: keyboard,
                                left: 0,
                                position: 'absolute',
                                right: 0,
                                ...(height === undefined
                                    ? scroll
                                        ? { maxHeight }
                                        : { height: maxHeight }
                                    : { height: Math.min(Math.max(0, height), maxHeight), maxHeight }),
                                ...shadow,
                                // `elevation` só existe no Android; 0 no iOS em vez de `undefined`, que o leitor de estilo do Reanimated não aceita.
                                elevation: Platform.OS === 'android' ? shadow.elevation : 0,
                            },
                            sheetMotionStyle,
                        ]}
                    >
                        {/* Só a alça e o cabeçalho iniciam o arrasto: o corpo segue com a rolagem e os próprios controles. */}
                        <GestureDetector gesture={drag}>
                            <View testID={`${ids.drag}-area`}>
                                <View style={{ alignItems: 'center', height: HANDLE_AREA_HEIGHT, justifyContent: 'center' }}>
                                    <View
                                        testID={ids.handle}
                                        style={{ backgroundColor: tokens.borderStrong, borderRadius: radii.pill, height: 5, width: 44 }}
                                    />
                                </View>
                                <PanelHeader
                                    testID={ids.header}
                                    title={title}
                                    description={description}
                                    metadata={headerMetadata}
                                    closeLabel={closeLabel}
                                    onClose={onClose}
                                />
                            </View>
                        </GestureDetector>
                        {scroll ? (
                            <ScrollView
                                showsHorizontalScrollIndicator={false}
                                testID={ids.scroll}
                                bounces={false}
                                style={{ flexShrink: 1 }}
                                contentContainerStyle={{
                                    gap: spacing.lg,
                                    paddingBottom: footer ? spacing.lg : bottomPadding,
                                    paddingHorizontal: layout.screenGutter,
                                    paddingTop: spacing.lg,
                                }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {children}
                            </ScrollView>
                        ) : (
                            <View testID={ids.scroll} style={{ flex: 1, minHeight: 0, paddingHorizontal: layout.screenGutter, paddingTop: spacing.lg }}>
                                {children}
                            </View>
                        )}
                        {footer ? (
                            <View
                                testID={ids.footer}
                                style={{
                                    borderTopColor: tokens.separator,
                                    borderTopWidth: 1,
                                    gap: spacing.xs,
                                    // Rodapé colado: ver resolveSheetFooterBottom; 8 acima da ação.
                                    paddingBottom: footerBottomPadding,
                                    paddingHorizontal: layout.screenGutter,
                                    paddingTop: spacing.sm,
                                }}
                            >
                                {footer}
                            </View>
                        ) : null}
                    </Reanimated.View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}
