import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import SegmentedTabs from '@/shared/component/SegmentedTabs';

import { DEMO_TABS, type DemoTabId } from './demo/demoTabs';
import { DemoPreview } from './demo/DemoPreview';

export default function Demo() {
    const { t } = useTranslation();
    const [active, setActive] = useState<DemoTabId>('library');

    const currentTab = DEMO_TABS.find(tab => tab.id === active) ?? DEMO_TABS[0];

    const tabItems = DEMO_TABS.map(tab => ({
        id: tab.id,
        label: t(tab.labelKey),
        icon: <Icon name={tab.icon} size={16} />,
    }));

    return (
        <MarketingSection id="demo">
            <SectionHeading
                eyebrow={t('demo.eyebrow')}
                title={t('demo.title')}
                description={t('demo.sub')}
            />
            <Reveal delay={80} className="mt-[34px] flex justify-center">
                <SegmentedTabs
                    ariaLabel={t('demo.tablistLabel')}
                    tabs={tabItems}
                    value={active}
                    onValueChange={setActive}
                    panelId="demo"
                />
            </Reveal>
            <Reveal delay={130} y={26} className="mt-8">
                <DemoPreview tab={currentTab} activeId={active} />
            </Reveal>
            <p className="m-[24px_0_0] text-center text-[0.8125rem] tracking-[0.02em] text-copy-muted">
                {t('demo.tip')}
            </p>
        </MarketingSection>
    );
}
