import { Stack } from 'expo-router';

import { useScreenTransitions } from '@/shared/navigation';
import { READER_SCREEN_OPTIONS } from '@/widgets/content-reader';

export default function ReaderPreviewLayout() {
    const { reader } = useScreenTransitions();

    return <Stack screenOptions={{ ...READER_SCREEN_OPTIONS, ...reader }} />;
}
