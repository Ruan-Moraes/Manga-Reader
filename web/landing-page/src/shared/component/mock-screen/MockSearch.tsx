import Icon from '@/shared/component/Icon';
import type { LandingUi } from '@/shared/data/landing';

export interface MockSearchProps {
    ui: LandingUi;
}

export function MockSearch({ ui }: MockSearchProps) {
    return (
        <div className="flex h-9 items-center gap-2 rounded-sm border border-line bg-primary px-3 text-tertiary">
            <Icon name="search" size={15} />
            <span className="text-xs tracking-[.0625rem]">
                {ui.searchPlaceholder}
            </span>
        </div>
    );
}

export default MockSearch;
