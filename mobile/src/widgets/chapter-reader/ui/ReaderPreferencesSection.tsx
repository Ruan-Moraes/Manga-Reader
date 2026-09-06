import type { ReaderSettings } from '@/entities/user-setting';
import { ReaderSettingsControls } from '@/features/configure-chapter-reader';

interface Props {
    value: ReaderSettings;
    onChange: (patch: Partial<ReaderSettings>) => void;
}

export function ReaderPreferencesSection({ value, onChange }: Props) {
    return <ReaderSettingsControls value={value} capabilities={{ low: false, medium: false, high: false }} onChange={onChange} />;
}
