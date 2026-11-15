import { View } from 'react-native';
import { Image } from 'expo-image';

import { useResponsiveLayout, useTheme } from '@/shared/theme';
import { AppText, IconButton, StatusMessage, TextAction } from '@/shared/ui';

import { APP_MODULES, type AppModuleId } from '../model/modules';
import { AppModuleCard } from './AppModuleCard';
import { EditorialHero } from './EditorialHero';

const LOGO = require('../../../../assets/images/logo.png');

interface ModuleSelectorProps {
    authenticated: boolean;
    copy: {
        eyebrow: string;
        title: string;
        subtitle: string;
        settings: string;
        library: string;
        modules: Record<AppModuleId, { title: string; description: string; status: string; action: string; authenticatedAction?: string }>;
    };
    onOpenModule: (module: AppModuleId) => void;
    onOpenSettings: () => void;
    onOpenLibrary: () => void;
    recovery?: { message: string; action: string; onRetry: () => void };
}

export function ModuleSelector({ authenticated, copy, onOpenModule, onOpenSettings, onOpenLibrary, recovery }: ModuleSelectorProps) {
    const { spacing } = useTheme();

    const responsive = useResponsiveLayout();

    // 2026-11-14: logo quadrado de 36 com cantos de ícone de app (~25% do lado), recortado na própria imagem.
    const logoSize = 36;

    return (
        <View
            style={{
                alignSelf: 'center',
                flex: 1,
                gap: spacing.md,
                maxWidth: responsive.contentMaxWidth,
                paddingBottom: spacing.xl,
                paddingTop: spacing.md,
                width: '100%',
            }}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                <Image source={LOGO} style={{ borderRadius: logoSize / 4, height: logoSize, width: logoSize }} contentFit="cover" />
                <AppText variant="title" style={{ flex: 1, marginLeft: spacing.sm }}>
                    Toonlira
                </AppText>
                <IconButton accessibilityLabel={copy.settings} icon="ellipsis-horizontal" onPress={onOpenSettings} />
            </View>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="eyebrow" tone="accent">
                    {copy.eyebrow}
                </AppText>
                <AppText accessibilityRole="header" variant="display">
                    {copy.title}
                </AppText>
                <AppText tone="muted">{copy.subtitle}</AppText>
            </View>
            <EditorialHero />
            {recovery ? <StatusMessage actionLabel={recovery.action} onAction={recovery.onRetry} title={recovery.message} tone="danger" /> : null}
            <View style={{ gap: spacing.md }}>
                {APP_MODULES.map(module => {
                    const item = copy.modules[module.id];

                    return (
                        <AppModuleCard
                            key={module.id}
                            module={module}
                            title={item.title}
                            description={item.description}
                            availabilityLabel={item.status}
                            actionLabel={authenticated && item.authenticatedAction ? item.authenticatedAction : item.action}
                            onPress={() => onOpenModule(module.id)}
                        />
                    );
                })}
            </View>
            <View style={{ alignItems: 'center' }}>
                <TextAction icon="library-outline" iconTile align="center" label={copy.library} onPress={onOpenLibrary} />
            </View>
        </View>
    );
}
