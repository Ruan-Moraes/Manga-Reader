import { Redirect, useLocalSearchParams } from 'expo-router';

import { ReaderPage } from '@/src/pages/reader';

export default function ReaderRoute() {
    const params = useLocalSearchParams<{ titleId?: string; number?: string }>();
    const titleId = Array.isArray(params.titleId) ? params.titleId[0] : params.titleId;
    const rawNumber = Array.isArray(params.number) ? params.number[0] : params.number;
    const number = rawNumber?.trim();

    if (!titleId || !number || !Number.isFinite(Number(number))) return <Redirect href="/" />;

    return <ReaderPage titleId={titleId} requestedChapter={number} />;
}
