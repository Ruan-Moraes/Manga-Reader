import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthCheckbox } from '@/src/components/auth/AuthCheckbox';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { Field } from '@/src/components/auth/Field';
import { MRIcon } from '@/src/components/auth/MRIcon';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { StrengthMeter } from '@/src/components/auth/StrengthMeter';
import { FONTS, MR } from '@/src/constants/theme';
import { authService } from '@/src/features/auth/model/authService';
import { useAuthStore } from '@/src/stores/authStore';

export default function RegisterScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [news, setNews] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const clear = (k: string) => {
    if (errors[k]) setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  const submit = async () => {
    if (loading) return;
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Informe seu e-mail.';
    if (!name.trim()) next.name = 'Escolha um nome de exibição.';
    if (pw.length < 8 || !/[0-9]/.test(pw)) next.pw = 'Senha precisa ter ao menos 8 caracteres e um número.';
    if (pw2 && pw2 !== pw) next.pw2 = 'As senhas não coincidem.';
    if (!terms) next.terms = 'É preciso aceitar os termos pra continuar.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const result = await authService.register({ name: name.trim(), email: email.trim(), password: pw });
      await login(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
      router.replace('/(tabs)');
    } catch {
      setErrors({ root: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: MR.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: MR.screenPadding, paddingTop: 58, paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          eyebrow="Junte-se à comunidade"
          title="Criar conta"
          sub="É grátis e sem anúncios. Leve sua estante pra qualquer lugar."
        />

        <Field
          label="E-mail" icon="mail" type="email" inputMode="email"
          value={email} onChange={(v) => { setEmail(v); clear('email'); }}
          placeholder="voce@email.com" error={errors.email}
        />

        <Field
          label="Nome de exibição" icon="user"
          value={name} onChange={(v) => { setName(v); clear('name'); }}
          placeholder="Como a comunidade vai te ver"
          autoCapitalize="words" error={errors.name}
        />

        <Field
          label="Senha" icon="lock" type={showPw ? 'text' : 'password'}
          value={pw} onChange={(v) => { setPw(v); clear('pw'); }}
          placeholder="Crie uma senha forte" error={errors.pw}
          trailing={
            <TouchableOpacity
              onPress={() => setShowPw((s) => !s)}
              style={{ position: 'absolute', right: 8, height: 36, width: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} color={MR.tertiary} />
            </TouchableOpacity>
          }
        />
        {!errors.pw && <StrengthMeter value={pw} />}

        <Field
          label="Confirmar senha" icon="lock" type={showPw ? 'text' : 'password'}
          value={pw2} onChange={(v) => { setPw2(v); clear('pw2'); }}
          placeholder="Repita a senha" error={errors.pw2}
        />

        <View style={{ height: 4 }} />

        <AuthCheckbox checked={terms} onChange={() => { setTerms((t) => !t); clear('terms'); }} error={errors.terms}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: errors.terms ? MR.danger : MR.muted, letterSpacing: MR.ls, lineHeight: 19 }}>
            Li e aceito os{' '}
            <Text style={{ color: MR.accent, fontFamily: FONTS.bold }}>Termos</Text>
            {' '}e a{' '}
            <Text style={{ color: MR.accent, fontFamily: FONTS.bold }}>Política de Privacidade</Text>.
          </Text>
        </AuthCheckbox>

        {errors.terms && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 12 }}>
            <MRIcon name="alert" size={13} color={MR.danger} />
            <Text style={{ fontSize: 11, color: MR.danger, letterSpacing: MR.ls, fontFamily: FONTS.regular }}>{errors.terms}</Text>
          </View>
        )}

        <AuthCheckbox checked={news} onChange={() => setNews((n) => !n)}>
          Quero receber novidades e lançamentos por e-mail (opcional).
        </AuthCheckbox>

        {errors.root && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MRIcon name="alert" size={13} color={MR.danger} />
            <Text style={{ fontSize: 11, color: MR.danger, letterSpacing: MR.ls, fontFamily: FONTS.regular }}>{errors.root}</Text>
          </View>
        )}

        <View style={{ height: 6 }} />
        <PrimaryButton onPress={submit} loading={loading}>Criar conta</PrimaryButton>

        <AuthFooter
          prompt="Já tem conta?"
          action="Entrar"
          onAction={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
