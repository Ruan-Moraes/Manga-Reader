import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { FONTS, MR } from '@/src/constants/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ children, onPress, loading, disabled }: Props) {
  const off = loading || disabled;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!off}
      activeOpacity={0.85}
      style={{
        height: MR.controlHeight, width: '100%', borderRadius: MR.radius,
        backgroundColor: off ? MR.inputBorder : MR.accent,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 10,
      }}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#666" />
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: '#666', letterSpacing: 1.7, textTransform: 'uppercase' }}>
            Aguarde…
          </Text>
        </>
      ) : (
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: MR.bg, letterSpacing: 1.7, textTransform: 'uppercase' }}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
