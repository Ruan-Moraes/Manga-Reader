import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '@/src/shared/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps extends Omit<ComponentProps<typeof Ionicons>, 'color' | 'name' | 'size'> {
    name: IconName;
    size?: number;
    color?: string;
    decorative?: boolean;
}

export function Icon({ name, size = 20, color, decorative = true, ...props }: IconProps) {
    const { tokens } = useTheme();
    return <Ionicons {...props} name={name} size={size} color={color ?? tokens.accentText} accessibilityElementsHidden={decorative} />;
}
