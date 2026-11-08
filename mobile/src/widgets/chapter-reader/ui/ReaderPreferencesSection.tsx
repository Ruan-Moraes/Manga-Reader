import type { ReaderSettings } from '@/entities/user-setting';
import { type ReaderSettingsCategory, ReaderSettingsControls } from '@/features/configure-chapter-reader';

interface Props {
    value: ReaderSettings;
    onChange: (patch: Partial<ReaderSettings>) => void;
    category?: ReaderSettingsCategory;
    compact?: boolean;
}

export function ReaderPreferencesSection({ value, onChange, category, compact }: Props) {
    return (
        <ReaderSettingsControls
            value={value}
            capabilities={{ low: false, medium: false, high: false }}
            onChange={onChange}
            category={category}
            compact={compact}
        />
    );
}
