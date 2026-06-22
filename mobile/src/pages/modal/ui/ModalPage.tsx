import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function ModalPage() {
    const { t } = useTranslation('common');

    return (
        <View className="flex-1 items-center justify-center">
            <Text className="text-xl font-bold text-gray-900">{t('modal.title')}</Text>
        </View>
    );
}
