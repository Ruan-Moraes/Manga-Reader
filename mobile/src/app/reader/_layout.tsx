import { Stack } from 'expo-router';

import { READER_SCREEN_OPTIONS } from '@/widgets/chapter-reader';

export default function ReaderLayout() {
    return <Stack screenOptions={READER_SCREEN_OPTIONS} />;
}
