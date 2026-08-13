import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { Button, Card, EmptyState, ScreenScaffold } from '@/src/shared/ui';

export function OfflineTranslationPage() {
    const { t } = useTranslation('launcher');
    const { tokens } = useTheme();

    return (
        <ScreenScaffold title={t('offline.pageTitle')} backLabel={t('navigation.selector')} onBack={() => router.replace(ROUTES.ROOT as never)}>
            <Card style={{ flex: 1 }}>
                <EmptyState
                    icon={<Ionicons name="language-outline" size={42} color={tokens.accentText} />}
                    title={t('offline.unavailableTitle')}
                    description={t('offline.unavailableDescription')}
                    action={
                        <Button onPress={() => router.push(ROUTES.SETTINGS.INDEX as never)} variant="outline">
                            {t('selector.settings')}
                        </Button>
                    }
                />
            </Card>
            <Button onPress={() => router.replace(ROUTES.ROOT as never)} variant="ghost">
                {t('navigation.backToSelector')}
            </Button>
        </ScreenScaffold>
    );
}
