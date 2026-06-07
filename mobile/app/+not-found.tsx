import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-bold text-gray-900">Página não encontrada.</Text>
        <Link href="/">
          <Text className="mt-4 text-sm text-blue-600">Ir para o início</Text>
        </Link>
      </View>
    </>
  );
}
