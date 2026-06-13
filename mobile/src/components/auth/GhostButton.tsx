import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { FONTS, MR } from '@/src/constants/theme';
import { MRIcon } from './MRIcon';

type IconName = React.ComponentProps<typeof MRIcon>['name'];

interface Props {
    children: React.ReactNode;
    onPress?: () => void;
    icon?: IconName;
    disabled?: boolean;
}

export function GhostButton({ children, onPress, icon, disabled }: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
            style={{
                height: MR.controlHeight,
                width: '100%',
                borderRadius: MR.radius,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: MR.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                // Signature offset shadow — iOS only (Android doesn't support colored offset shadows)
                ...Platform.select({
                    ios: {
                        shadowColor: MR.accent,
                        shadowOffset: { width: -4, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 0,
                    },
                }),
            }}
        >
            {icon && <MRIcon name={icon} size={20} color={disabled ? MR.tertiary : MR.accent} />}
            <Text
                style={{
                    fontFamily: FONTS.bold,
                    fontSize: 14,
                    color: disabled ? MR.tertiary : MR.text,
                    letterSpacing: MR.ls,
                }}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
}
