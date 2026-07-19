import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrowserFrame, PhoneFrame } from '@/shared/component/DeviceFrames';
import Icon, { type IconName } from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import {
    MOCK_SCREENS,
    type MockScreenName,
} from '@/shared/component/mock-screen';
import Reveal from '@/shared/component/Reveal';
import SegmentedTabs from '@/shared/component/SegmentedTabs';

type DemoTabId = 'library' | 'title' | 'reader' | 'profile';
interface DemoTab {
    id: DemoTabId;
    label: string;
    icon: IconName;
    screen: MockScreenName;
    url: string;
}

export default function Demo() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const [active, setActive] = useState<DemoTabId>('library');
    const tabs: DemoTab[] = [
        {
            id: 'library',
            label: t('demo.tabs.library'),
            icon: 'library',
            screen: 'LibraryScreen',
            url: 'app.mangareader.com/biblioteca',
        },
        {
            id: 'title',
            label: t('demo.tabs.title'),
            icon: 'eye',
            screen: 'TitleScreen',
            url: 'app.mangareader.com/obra/frieren',
        },
        {
            id: 'reader',
            label: t('demo.tabs.reader'),
            icon: 'play',
            screen: 'ReaderScreen',
            url: 'app.mangareader.com/ler/frieren-140',
        },
        {
            id: 'profile',
            label: t('demo.tabs.profile'),
            icon: 'user',
            screen: 'ProfileScreen',
            url: 'app.mangareader.com/perfil',
        },
    ];
    const current = tabs.find(tab => tab.id === active) ?? tabs[0];
    const Screen = MOCK_SCREENS[current.screen];

    return (
        <MarketingSection key={locale} id="demo">
            <SectionHeading
                eyebrow={t('demo.eyebrow')}
                title={t('demo.title')}
                description={t('demo.sub')}
            />
            <Reveal delay={80} className="mt-[34px] flex justify-center">
                <SegmentedTabs
                    ariaLabel={t('demo.tablistLabel')}
                    tabs={tabs.map(tab => ({
                        id: tab.id,
                        label: tab.label,
                        icon: <Icon name={tab.icon} size={16} />,
                    }))}
                    value={active}
                    onValueChange={setActive}
                    panelId="demo"
                />
            </Reveal>
            <Reveal delay={130} y={26} className="mt-8">
                <div
                    id="demo-panel"
                    role="tabpanel"
                    aria-labelledby={`demo-tab-${active}`}
                    tabIndex={0}
                    className="relative flex items-end justify-center gap-7 rounded-2xl"
                >
                    <div className="relative z-[1] min-w-0 max-w-[880px] flex-[1_1_680px]">
                        <BrowserFrame
                            url={current.url}
                            label={`${t('demo.tablistLabel')}: ${current.label}`}
                        >
                            <div
                                key={active}
                                className="h-[clamp(330px,48vw,460px)] overflow-hidden animate-fade"
                            >
                                <Screen />
                            </div>
                        </BrowserFrame>
                    </div>
                    <PhoneFrame
                        w={208}
                        className="relative z-[2] hidden lg:block"
                        label={`${current.label} — mobile`}
                    >
                        <div key={`${active}-mobile`} className="animate-fade">
                            <Screen />
                        </div>
                    </PhoneFrame>
                </div>
            </Reveal>
            <p className="m-[24px_0_0] text-center text-[0.8125rem] tracking-[0.02em] text-copy-muted">
                {t('demo.tip')}
            </p>
        </MarketingSection>
    );
}
