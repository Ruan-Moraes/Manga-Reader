import { useLocalSearchParams } from 'expo-router';

import { LocalTranslationReaderPage } from '@/pages/offline-translation';

export default function TranslationReaderRoute() {
    const params = useLocalSearchParams<{ projectId?: string | string[] }>();

    const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

    return <LocalTranslationReaderPage projectId={projectId ?? ''} />;
}
