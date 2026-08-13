import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconName = 'mail' | 'lock' | 'eye' | 'eye-off' | 'check' | 'user' | 'arrow-left' | 'send' | 'alert';

interface Props {
    name: IconName;
    size?: number;
    color?: string;
    strokeWidth?: number;
}

export function MRIcon({ name, size = 20, color = 'currentColor', strokeWidth = 2 }: Props) {
    const props = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none' as const,
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    switch (name) {
        case 'mail':
            return (
                <Svg {...props}>
                    <Rect x="2" y="4" width="20" height="16" rx="2" />
                    <Path d="M2 7l10 6 10-6" />
                </Svg>
            );
        case 'lock':
            return (
                <Svg {...props}>
                    <Rect x="4" y="11" width="16" height="10" rx="2" />
                    <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </Svg>
            );
        case 'eye':
            return (
                <Svg {...props}>
                    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <Circle cx="12" cy="12" r="3" />
                </Svg>
            );
        case 'eye-off':
            return (
                <Svg {...props}>
                    <Path d="M10.7 6.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7" />
                    <Path d="M6.1 6.1C3.4 7.8 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9" />
                    <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    <Path d="M3 3l18 18" />
                </Svg>
            );
        case 'check':
            return (
                <Svg {...props}>
                    <Path d="M20 6 9 17l-5-5" />
                </Svg>
            );
        case 'user':
            return (
                <Svg {...props}>
                    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <Circle cx="12" cy="7" r="4" />
                </Svg>
            );
        case 'arrow-left':
            return (
                <Svg {...props}>
                    <Path d="M19 12H5" />
                    <Path d="m12 19-7-7 7-7" />
                </Svg>
            );
        case 'send':
            return (
                <Svg {...props}>
                    <Path d="M22 2 11 13" />
                    <Path d="M22 2 15 22l-4-9-9-4 20-7Z" />
                </Svg>
            );
        case 'alert':
            return (
                <Svg {...props}>
                    <Circle cx="12" cy="12" r="9" />
                    <Path d="M12 8v4" />
                    <Path d="M12 16h.01" />
                </Svg>
            );
        default:
            return null;
    }
}
