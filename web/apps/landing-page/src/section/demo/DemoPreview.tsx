import { useTranslation } from 'react-i18next';

import { BrowserFrame, PhoneFrame } from '@/shared/component/DeviceFrames';
import { MOCK_SCREENS } from '@/shared/component/mock-screen';
import type { DemoTabDefinition } from './demoTabs';

interface DemoPreviewProps {
    tab: DemoTabDefinition;
    activeId: string;
}

export function DemoPreview({ tab, activeId }: DemoPreviewProps) {
    const { t } = useTranslation();
    const label = t(tab.labelKey);
    const Screen = MOCK_SCREENS[tab.screen];

    return (
        <div
            id="demo-panel"
            role="tabpanel"
            aria-labelledby={`demo-tab-${activeId}`}
            tabIndex={0}
            className="relative flex items-end justify-center gap-7 rounded-2xl"
        >
            <div className="relative z-[1] min-w-0 max-w-[880px] flex-[1_1_680px]">
                <BrowserFrame
                    url={tab.url}
                    label={`${t('demo.tablistLabel')}: ${label}`}
                >
                    <div
                        key={activeId}
                        className="h-[clamp(330px,48vw,460px)] overflow-hidden animate-fade"
                    >
                        <Screen />
                    </div>
                </BrowserFrame>
            </div>
            <PhoneFrame
                w={208}
                className="relative z-[2] hidden lg:block"
                label={`${label} — mobile`}
            >
                <div key={`${activeId}-mobile`} className="animate-fade">
                    <Screen />
                </div>
            </PhoneFrame>
        </div>
    );
}
