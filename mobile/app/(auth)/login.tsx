import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthCheckbox } from '@/src/components/auth/AuthCheckbox';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { DemoCredentials } from '@/src/components/auth/DemoCredentials';
import { Field } from '@/src/components/auth/Field';
import { GhostButton } from '@/src/components/auth/GhostButton';
import { MRIcon } from '@/src/components/auth/MRIcon';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { SocialRow } from '@/src/components/auth/SocialRow';
import { FONTS, MR } from '@/src/constants/theme';
import { authService } from '@/src/features/auth/model/authService';
import { useAuthStore } from '@/src/stores/authStore';

export default function LoginScreen() {
  const login = useAuthStore(s => s.login);

    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (loading || !email.trim() || !password) return;

        setError('');
        setLoading(true);

        try {
            const result = await authService.login({ email: email.trim(), password });

            await login(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });

            router.replace('/(tabs)');
        } catch {
            setError('E-mail ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: MR.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: MR.screenPadding, paddingTop: 58, paddingBottom: 36 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader
                    eyebrow="Bem-vindo de volta"
                    title="Que bom te ver de novo"
                    sub="Acesse sua biblioteca, continue de onde parou e participe da comunidade."
                />

                <Field
                    label="E-mail"
                    icon="mail"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        if (error) setError('');
                    }}
                    placeholder="voce@email.com"
                    error={error ? ' ' : ''}
                />

                <Field
                    label="Senha"
                    icon="lock"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={v => {
                        setPassword(v);
                        if (error) setError('');
                    }}
                    placeholder="••••••••"
                    error={error}
                    rightSlot={
                        <TouchableOpacity onPress={() => router.push('/(auth)/forgot')}>
                            <Text style={{ fontSize: 11, color: MR.subtle, letterSpacing: MR.ls, fontFamily: FONTS.regular }}>Esqueci a senha</Text>
                        </TouchableOpacity>
                    }
                    trailing={
                        <TouchableOpacity
                            onPress={() => setShowPw(s => !s)}
                            style={{ position: 'absolute', right: 8, height: 36, width: 36, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} color={MR.tertiary} />
                        </TouchableOpacity>
                    }
                />

                <AuthCheckbox checked={remember} onChange={() => setRemember(r => !r)}>
                    Manter sessão ativa neste dispositivo
                </AuthCheckbox>

                <View style={{ height: 6 }} />
                <PrimaryButton onPress={submit} loading={loading}>
                    Entrar
                </PrimaryButton>

                <View style={{ marginTop: 12 }}>
                    <GhostButton icon="face-id">Entrar com Face ID</GhostButton>
                </View>

                <SocialRow />

                {__DEV__ && (
                    <DemoCredentials
                        onFill={(e, p) => {
                            setEmail(e);
                            setPassword(p);
                            setError('');
                        }}
                    />
                )}

                <AuthFooter prompt="Ainda não tem conta?" action="Criar conta" onAction={() => router.push('/(auth)/register')} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
