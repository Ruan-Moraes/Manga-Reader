import { useTheme } from '@/shared/theme';

/**
 * `transition` for `expo-image` covers and thumbnails: they fade in over `motion.base` instead of popping in, and appear
 * at once when decorative motion is off (etapa 4 do plano de animações).
 */
export function useImageFade(): number | null {
    const { decorativeMotionEnabled, motion } = useTheme();
    return decorativeMotionEnabled ? motion.base : null;
}
