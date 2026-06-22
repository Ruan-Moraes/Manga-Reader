import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LibraryPage() {
    const { t } = useTranslation('common');
    return (
        <SafeAreaView className="flex-1 bg-mr-bg">
            <View className="flex-1 items-center justify-center">
                <Text className="text-2xl font-bold text-mr-text">{t('nav.library')}</Text>
                <Text className="mt-2 text-mr-muted">{t('library.comingSoon')}</Text>
            </View>
        </SafeAreaView>
    );
}
