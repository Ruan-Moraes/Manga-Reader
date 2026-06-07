import { Text, TouchableOpacity, View } from 'react-native';
import { FONTS, MR } from '@/src/constants/theme';

interface Props {
  prompt: string;
  action: string;
  onAction: () => void;
}

export function AuthFooter({ prompt, action, onAction }: Props) {
  return (
    <View style={{
      marginTop: 24, paddingTop: 20,
      borderTopWidth: 1, borderTopColor: MR.inputBorder,
      alignItems: 'center',
    }}>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: MR.subtle, letterSpacing: MR.ls }}>
        {prompt}{' '}
        <Text
          onPress={onAction}
          style={{ fontFamily: FONTS.bold, color: MR.accent }}
        >
          {action}
        </Text>
      </Text>
    </View>
  );
}
