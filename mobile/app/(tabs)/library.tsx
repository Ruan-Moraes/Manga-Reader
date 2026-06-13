import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
    return (
        <SafeAreaView className="flex-1 bg-mr-bg">
            <View className="flex-1 items-center justify-center">
                <Text className="text-2xl font-bold text-mr-text">Biblioteca</Text>
                <Text className="mt-2 text-mr-muted">Em breve: seus mangás salvos</Text>
            </View>
        </SafeAreaView>
    );
}
