import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { AppText, Button, Icon, type IconName } from '@/shared/ui';

/**
 * Batch status shown inside the progress card. Each state is derived from the same per-page
 * statuses as the rows and the summary, so the strip never contradicts them.
 */
export type BatchStripState =
    | { kind: 'running'; page: number | null; queued: number }
    | { kind: 'stopping'; page: number | null }
    | { kind: 'completed'; total: number }
    | { kind: 'failed'; count: number };

interface Props {
    state: BatchStripState;
    onStop(): void;
}

export function BatchStatusStrip({ state, onStop }: Props) {
    const { t } = useTranslation('remoteProcessing');

    const { metrics, radii, spacing, tokens } = useTheme();

    const look: Record<BatchStripState['kind'], { background: string; color: string; icon?: IconName }> = {
        running: { background: tokens.accentSoft, color: tokens.accentText },
        stopping: { background: tokens.surfaceMuted, color: tokens.muted, icon: 'pause' },
        completed: { background: tokens.successSoft, color: tokens.success, icon: 'checkmark' },
        failed: { background: tokens.dangerSoft, color: tokens.danger, icon: 'alert' },
    };

    const { background, color, icon } = look[state.kind];

    const [title, description] = (() => {
        switch (state.kind) {
            case 'running':
                return state.page === null
                    ? [t('batch.strip.preparingTitle'), t('actions.processing')]
                    : [t('batch.strip.runningTitle', { page: state.page }), t('batch.strip.queued', { count: state.queued })];
            case 'stopping':
                return [state.page === null ? t('batch.stopping') : t('batch.strip.stoppingTitle', { page: state.page }), t('batch.strip.stoppingDescription')];
            case 'completed':
                return [t('batch.strip.completedTitle'), t('batch.strip.completedDescription', { count: state.total })];
            case 'failed':
                return [t('batch.strip.failedTitle', { count: state.count }), t('batch.strip.failedDescription')];
        }
    })();

    const tile = metrics.iconTile.default;

    return (
        <View testID={`batch-strip-${state.kind}`} style={{ backgroundColor: background, borderRadius: radii.control, overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
                <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.surface,
                        borderRadius: radii.pill,
                        height: tile,
                        justifyContent: 'center',
                        width: tile,
                    }}
                >
                    {icon ? <Icon name={icon} size={metrics.icon.md} color={color} decorative /> : <ActivityIndicator size="small" color={color} />}
                </View>
                <View accessible accessibilityLiveRegion="polite" style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <AppText variant="label" style={{ color: state.kind === 'running' || state.kind === 'stopping' ? tokens.text : color }}>
                        {title}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                </View>
            </View>
            {state.kind === 'running' ? (
                <View style={{ paddingBottom: spacing.md, paddingHorizontal: spacing.md }}>
                    <Button
                        variant="outline"
                        size="compact"
                        onPress={onStop}
                        leading={<Icon name="stop-circle-outline" size={metrics.icon.md} color={tokens.accentText} decorative />}
                    >
                        {t('batch.stop')}
                    </Button>
                </View>
            ) : null}
        </View>
    );
}
