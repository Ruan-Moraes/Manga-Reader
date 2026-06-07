import { Text, View } from 'react-native';
import { FONTS, MR } from '@/src/constants/theme';

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: '', tone: MR.tertiary };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  const score = Math.min(s, 4);
  const map: Record<number, { label: string; tone: string }> = {
    1: { label: 'Fraca', tone: MR.danger },
    2: { label: 'Razoável', tone: MR.warn },
    3: { label: 'Boa', tone: '#8bc34a' },
    4: { label: 'Forte', tone: MR.success },
  };
  return { score, ...(map[score] ?? { label: 'Fraca', tone: MR.danger }) };
}

export function StrengthMeter({ value }: { value: string }) {
  const { score, label, tone } = passwordStrength(value);
  return (
    <View style={{ marginTop: -6, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            backgroundColor: i <= score ? tone : MR.inputBorder,
          }} />
        ))}
      </View>
      <Text style={{
        marginTop: 6, fontSize: 11, letterSpacing: MR.ls, minHeight: 14,
        color: score ? tone : MR.tertiary, fontFamily: FONTS.regular,
      }}>
        {score ? `Senha ${label.toLowerCase()}` : 'Mín. 8 caracteres, com número'}
      </Text>
    </View>
  );
}
