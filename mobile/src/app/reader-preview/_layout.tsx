import { Stack } from 'expo-router';

import { READER_SCREEN_OPTIONS } from '@/widgets/content-reader';

export default function ReaderPreviewLayout() {
    return <Stack screenOptions={READER_SCREEN_OPTIONS} />;
}
