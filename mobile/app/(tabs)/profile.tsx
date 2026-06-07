import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-mr-bg">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-mr-text">Perfil</Text>
        {user && (
          <View className="mt-4">
            <Text className="text-lg font-medium text-mr-text">{user.name}</Text>
            <Text className="text-mr-muted">{user.email}</Text>
          </View>
        )}
        <Pressable
          className="mt-8 items-center rounded-lg border border-mr-danger/30 py-3"
          onPress={handleLogout}
        >
          <Text className="font-semibold text-mr-danger">Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
