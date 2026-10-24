import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { type LocalTranslationLibraryItem, type LocalTranslationResultRepository, localTranslationResultRepository } from '@/entities/local-translation-result';
import { type RemoveLocalTranslationProjectController, removeLocalTranslationProjectController } from '@/features/local-translation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, StatusMessage } from '@/shared/ui';

interface Props {
    onOpen(projectId: string): void;
    onCreate(): void;
    repository?: LocalTranslationResultRepository;
    removeController?: RemoveLocalTranslationProjectController;
}

export function LocalTranslationLibrary({
    onOpen,
    onCreate,
    repository = localTranslationResultRepository,
    removeController = removeLocalTranslationProjectController,
}: Props) {
    const { t, i18n } = useTranslation('localTranslation');
    const { radii, spacing, tokens } = useTheme();
    const [items, setItems] = useState<LocalTranslationLibraryItem[] | null>(null);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        setError(false);
        try {
            await repository.initialize();
            setItems(await repository.listLibrary());
        } catch {
            setError(true);
        }
    }, [repository]);

    useEffect(() => {
        void load();
    }, [load]);

    const confirmRemove = (item: LocalTranslationLibraryItem) => {
        Alert.alert(t('library.deleteTitle'), t('library.deleteDescription'), [
            { text: t('actions.cancel'), style: 'cancel' },
            {
                text: t('actions.delete'),
                style: 'destructive',
                onPress: () =>
                    void removeController
                        .remove(item.project.id)
                        .then(load)
                        .catch(() => setError(true)),
            },
        ]);
    };

    if (error) {
        return (
            <StatusMessage
                title={t('library.errorTitle')}
                description={t('library.errorDescription')}
                tone="danger"
                actionLabel={t('actions.retry')}
                onAction={() => void load()}
            />
        );
    }
    if (items?.length === 0) {
        return (
            <EmptyState
                title={t('library.emptyTitle')}
                description={t('library.emptyDescription')}
                action={<Button onPress={onCreate}>{t('library.create')}</Button>}
            />
        );
    }
    if (!items) return <StatusMessage title={t('library.loading')} tone="loading" />;

    return (
        <View style={{ gap: spacing.md }}>
            {items.map(item => {
                const page = item.currentPosition === null ? 1 : item.currentPosition + 1;
                return (
                    <Card key={item.project.id} style={{ gap: spacing.md }}>
                        <Image
                            source={{ uri: item.coverUri }}
                            contentFit="cover"
                            accessibilityLabel={t('library.coverLabel')}
                            style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.control, height: 180, width: '100%' }}
                        />
                        <View style={{ gap: spacing.xs }}>
                            <AppText variant="section">
                                {t('library.projectTitle', { date: new Intl.DateTimeFormat(i18n.language).format(item.project.createdAt) })}
                            </AppText>
                            <AppText tone="muted">
                                {t('library.summary', {
                                    source: item.project.sourceLanguage,
                                    target: item.project.targetLanguage,
                                    ready: item.readyPages,
                                    total: item.project.pages.length,
                                })}
                            </AppText>
                            <AppText tone="muted">{t('library.position', { page, total: item.project.pages.length })}</AppText>
                            {item.demo ? <AppText style={{ color: tokens.warn }}>{t('demo.badge')}</AppText> : null}
                        </View>
                        <Button disabled={item.readyPages === 0} onPress={() => onOpen(item.project.id)}>
                            {t('library.open')}
                        </Button>
                        <Button tone="danger" variant="outline" onPress={() => confirmRemove(item)}>
                            {t('actions.delete')}
                        </Button>
                    </Card>
                );
            })}
        </View>
    );
}
