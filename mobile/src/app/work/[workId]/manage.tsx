import { useLocalSearchParams } from 'expo-router';

import { LocalWorkManagePage } from '@/pages/offline-translation';

export default function WorkManageRoute() {
    const params = useLocalSearchParams<{ workId?: string | string[] }>();

    const workId = Array.isArray(params.workId) ? params.workId[0] : params.workId;

    return <LocalWorkManagePage workId={workId ?? ''} />;
}
