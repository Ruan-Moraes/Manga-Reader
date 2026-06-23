import { Platform, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

import { MRIcon } from './MRIcon';

type IconName = React.ComponentProps<typeof MRIcon>['name'];

interface Props {
    children: React.ReactNode;
    onPress?: () => void;
    icon?: IconName;
    disabled?: boolean;
}

export function GhostButton({ children, onPress, icon, disabled }: Props) {
    const { tokens } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
            style={{
                height: tokens.controlHeight,
                width: '100%',
                borderRadius: tokens.radius,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: tokens.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                ...Platform.select({
                    ios: {
                        shadowColor: tokens.accent,
                        shadowOffset: { width: -4, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 0,
                    },
                }),
            }}
        >
            {icon && <MRIcon name={icon} size={20} color={disabled ? tokens.tertiary : tokens.accent} />}
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: disabled ? tokens.tertiary : tokens.text, letterSpacing: tokens.ls }}>{children}</Text>
        </TouchableOpacity>
    );
}
