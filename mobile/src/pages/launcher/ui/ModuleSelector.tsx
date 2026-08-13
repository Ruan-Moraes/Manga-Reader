import { View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { AppText, Button } from '@/src/shared/ui';

import { APP_MODULES, type AppModuleId } from '../model/modules';
import { AppModuleCard } from './AppModuleCard';

interface ModuleSelectorProps {
    authenticated: boolean;
    copy: {
        eyebrow: string;
        title: string;
        subtitle: string;
        settings: string;
        modules: Record<AppModuleId, { title: string; description: string; status: string; action: string; authenticatedAction?: string }>;
    };
    onOpenModule: (module: AppModuleId) => void;
    onOpenSettings: () => void;
    recovery?: { message: string; action: string; onRetry: () => void };
}

export function ModuleSelector({ authenticated, copy, onOpenModule, onOpenSettings, recovery }: ModuleSelectorProps) {
    const { layout, radii, spacing, tokens } = useTheme();

    return (
        <View style={{ flex: 1, gap: layout.sectionGap, paddingBottom: spacing.xl, paddingTop: spacing.xl }}>
            <View style={{ gap: spacing.sm }}>
                <AppText variant="eyebrow" tone="accent">
                    {copy.eyebrow}
                </AppText>
                <AppText accessibilityRole="header" variant="display">
                    {copy.title}
                </AppText>
                <AppText tone="muted">{copy.subtitle}</AppText>
            </View>
            {recovery ? (
                <View
                    accessibilityLiveRegion="assertive"
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.danger,
                        borderRadius: radii.card,
                        borderWidth: 1,
                        gap: spacing.sm,
                        padding: spacing.md,
                    }}
                >
                    <AppText accessibilityRole="alert" tone="danger">
                        {recovery.message}
                    </AppText>
                    <Button fullWidth={false} onPress={recovery.onRetry} variant="outline">
                        {recovery.action}
                    </Button>
                </View>
            ) : null}
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
            <Button onPress={onOpenSettings} variant="ghost">
                {copy.settings}
            </Button>
        </View>
    );
}
