import type { ReaderSettings } from '@/src/entities/user-setting';
import { ReaderSettingsControls } from '@/src/features/configure-chapter-reader';

interface Props {
    value: ReaderSettings;
    onChange: (patch: Partial<ReaderSettings>) => void;
}

export function ReaderPreferencesSection({ value, onChange }: Props) {
    return <ReaderSettingsControls value={value} capabilities={{ low: false, medium: false, high: false }} onChange={onChange} />;
}
