import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FONTS, MR } from '@/src/constants/theme';
import { MRIcon } from './MRIcon';

type IconName = React.ComponentProps<typeof MRIcon>['name'];

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  type?: 'text' | 'email' | 'password';
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  trailing?: React.ReactNode;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  inputMode?: 'email' | 'text' | 'none';
  onBlur?: () => void;
}

export function Field({
  label, value, onChange, placeholder, icon, type = 'text', error, hint,
  rightSlot, trailing, autoCapitalize = 'none', inputMode, onBlur,
}: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? MR.danger : focused ? MR.accent : MR.inputBorder;
  const iconColor = focused ? MR.accent : MR.tertiary;
  const labelColor = error ? MR.danger : MR.accent;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
        <Text style={{
          fontSize: 11, fontWeight: '800', fontFamily: FONTS.extrabold,
          letterSpacing: 1.1, textTransform: 'uppercase', color: labelColor,
        }}>{label}</Text>
        {rightSlot}
      </View>

      <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
        {icon && (
          <View style={{ position: 'absolute', left: 14, zIndex: 1, pointerEvents: 'none' as any }}>
            <MRIcon name={icon} size={18} color={iconColor} />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={MR.tertiary}
          secureTextEntry={type === 'password'}
          keyboardType={inputMode === 'email' ? 'email-address' : 'default'}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          style={{
            flex: 1, height: MR.controlHeight,
            paddingLeft: icon ? 42 : 14,
            paddingRight: trailing ? 46 : 14,
            backgroundColor: MR.inputBg,
            color: MR.text,
            borderWidth: 1, borderColor, borderRadius: MR.radius,
            fontFamily: FONTS.regular, fontSize: 15, letterSpacing: MR.ls,
          }}
        />
        {trailing}
      </View>

      {error && error.trim() ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
          <MRIcon name="alert" size={13} color={MR.danger} />
          <Text style={{ fontSize: 11, color: MR.danger, letterSpacing: MR.ls, fontFamily: FONTS.regular }}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={{ marginTop: 7, fontSize: 11, color: MR.tertiary, letterSpacing: MR.ls, fontFamily: FONTS.regular }}>{hint}</Text>
      ) : null}
    </View>
  );
}
