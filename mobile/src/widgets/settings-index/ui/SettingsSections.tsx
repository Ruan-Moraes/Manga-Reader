import { View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { useTheme } from '@/src/shared/theme';

export function SettingsSections({ children }: PropsWithChildren) {
    const { spacing } = useTheme();
    return <View style={{ gap: spacing.xl }}>{children}</View>;
}
