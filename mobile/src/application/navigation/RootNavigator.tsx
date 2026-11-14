import { Stack } from 'expo-router';

import { useScreenTransitions } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { READER_SCREEN_OPTIONS } from '@/widgets/content-reader';

/** MOB-FEAT-069: cada rota da raiz declara o tipo de transição; rota sem declaração herda a troca de módulo. */
export function RootNavigator() {
    const { tokens } = useTheme();
    const transitions = useScreenTransitions();
    const reader = { ...READER_SCREEN_OPTIONS, ...transitions.reader };

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
                ...transitions.contextSwitch,
            }}
        >
            <Stack.Screen name="index" options={transitions.contextSwitch} />
            <Stack.Screen name="(auth)" options={transitions.contextSwitch} />
            <Stack.Screen name="platform" options={transitions.contextSwitch} />
            <Stack.Screen name="translation-library" options={transitions.contextSwitch} />
            <Stack.Screen name="settings" options={transitions.drillIn} />
            <Stack.Screen name="work/[workId]/index" options={transitions.drillIn} />
            <Stack.Screen name="work/[workId]/manage" options={transitions.drillIn} />
            <Stack.Screen name="offline-translation" options={transitions.modalFlow} />
            <Stack.Screen name="reader" options={reader} />
            <Stack.Screen name="translation-reader/[projectId]" options={reader} />
            {__DEV__ ? <Stack.Screen name="reader-preview" options={reader} /> : null}
            <Stack.Screen name="+not-found" options={transitions.contextSwitch} />
        </Stack>
    );
}
