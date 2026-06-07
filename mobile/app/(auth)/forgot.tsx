import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { Field } from '@/src/components/auth/Field';
import { GhostButton } from '@/src/components/auth/GhostButton';
import { MRIcon } from '@/src/components/auth/MRIcon';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { FONTS, MR } from '@/src/constants/theme';

const MASCOT_PENSANDO = require('../../assets/images/mascot-pensando.png');

export default function ForgotScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (tick.current) clearInterval(tick.current);
  }, []);

  const startCooldown = () => {
    setCooldown(30);
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(tick.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const submit = () => {
    if (loading) return;
    if (!email.trim() || !/.+@.+\..+/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    setError('');
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      setSent(true);
      startCooldown();
    }, 700);
  };

  const retry = () => {
    setSent(false);
    setError('');
    setCooldown(0);
    if (tick.current) clearInterval(tick.current);
  };

  // ── Step 2: link sent ──────────────────────────────────────
  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: MR.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: MR.screenPadding, paddingVertical: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Image source={MASCOT_PENSANDO} style={{ width: 140, height: 140 }} contentFit="contain" />
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14,
          paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
          backgroundColor: `${MR.accent}28`, borderWidth: 1, borderColor: `${MR.accent}80`,
        }}>
          <MRIcon name="send" size={13} color={MR.accent} />
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11, color: MR.accent, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            Link enviado
          </Text>
        </View>

        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 26, color: MR.text, letterSpacing: MR.ls, lineHeight: 31, textAlign: 'center', marginBottom: 14 }}>
          Olha sua caixa de entrada
        </Text>

        <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: MR.subtle, letterSpacing: MR.ls, lineHeight: 21, textAlign: 'center', maxWidth: 300, marginBottom: 28 }}>
          Mandamos um link de recuperação para{' '}
          <Text style={{ color: MR.text, fontFamily: FONTS.bold }}>{email.trim()}</Text>.
          {' '}Ele vale por 30 minutos.
        </Text>

        <View style={{ width: '100%', maxWidth: 340 }}>
          <GhostButton icon="mail" disabled={cooldown > 0} onPress={startCooldown}>
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Não chegou? Reenviar'}
          </GhostButton>
        </View>

        <TouchableOpacity onPress={retry} style={{ marginTop: 18 }}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: MR.subtle, letterSpacing: MR.ls }}>
            Errou o e-mail?{' '}
            <Text style={{ color: MR.accent, fontFamily: FONTS.bold }}>Tentar de novo</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Step 1: request email ──────────────────────────────────
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22, alignSelf: 'flex-start' }}
        >
          <MRIcon name="arrow-left" size={18} color={MR.subtle} />
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: MR.subtle, letterSpacing: MR.ls }}>
            Voltar pro login
          </Text>
        </TouchableOpacity>

        <AuthHeader
          layout="minimal"
          eyebrow="Recuperar acesso"
          title="Esqueci a senha"
          sub="Sem problema. Informe o e-mail da sua conta e enviamos um link para você criar uma nova senha."
        />

        <Field
          label="E-mail cadastrado" icon="mail" type="email" inputMode="email"
          value={email} onChange={(v) => { setEmail(v); if (error) setError(''); }}
          placeholder="voce@email.com" error={error}
          hint="Por segurança, mostramos a confirmação mesmo se o e-mail não estiver cadastrado."
        />

        <View style={{ height: 6 }} />
        <PrimaryButton onPress={submit} loading={loading}>Enviar link</PrimaryButton>

        <AuthFooter
          prompt="Lembrou a senha?"
          action="Voltar pro login"
          onAction={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
