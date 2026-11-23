import { useLocalSearchParams } from 'expo-router';

import { LocalWorkPage } from '@/pages/offline-translation';

export default function WorkRoute() {
    const params = useLocalSearchParams<{ workId?: string | string[] }>();

    const workId = Array.isArray(params.workId) ? params.workId[0] : params.workId;

    return <LocalWorkPage workId={workId ?? ''} />;
}
