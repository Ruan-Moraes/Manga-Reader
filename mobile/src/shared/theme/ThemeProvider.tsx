import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { type ColorScheme, darkTokens, lightTokens, type ThemeTokens } from './tokens';

interface ThemeContextValue {
    tokens: ThemeTokens;
    colorScheme: ColorScheme;
    /** Override do sistema (null = seguir o SO) */
    override: ColorScheme | null;
    setOverride: (scheme: ColorScheme | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    tokens: darkTokens,
    colorScheme: 'dark',
    override: null,
    setOverride: () => {},
});

interface Props {
    children: React.ReactNode;
    /** Valor inicial vindo do settingsStore (opcional, para SSR/hidratação) */
    initialOverride?: ColorScheme | null;
    onOverrideChange?: (scheme: ColorScheme | null) => void;
}

export function ThemeProvider({ children, initialOverride = null, onOverrideChange }: Props) {
    const systemScheme = useColorScheme();
    const [override, setOverrideState] = useState<ColorScheme | null>(initialOverride);

    const colorScheme: ColorScheme = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
    const tokens = colorScheme === 'dark' ? darkTokens : lightTokens;

    const setOverride = (scheme: ColorScheme | null) => {
        setOverrideState(scheme);
        onOverrideChange?.(scheme);
    };

    useEffect(() => {
        if (initialOverride !== override) {
            setOverrideState(initialOverride);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialOverride]);

    return <ThemeContext.Provider value={{ tokens, colorScheme, override, setOverride }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
