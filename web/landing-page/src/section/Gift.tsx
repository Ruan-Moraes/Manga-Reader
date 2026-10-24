import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import SegmentedTabs from '@/shared/component/SegmentedTabs';

import { GiftGivePanel } from './gift/GiftGivePanel';
import { GiftRedeemPanel } from './gift/GiftRedeemPanel';

type Tab = 'give' | 'redeem';

export default function Gift() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('give');

    return (
        <MarketingSection id="gift" tone="raised">
            <SectionHeading
                eyebrow={t('gift.eyebrow')}
                title={t('gift.title')}
                description={t('gift.sub')}
            />
            <Reveal delay={80} className="mt-[34px] flex justify-center">
                <SegmentedTabs
                    ariaLabel={t('gift.tablistLabel')}
                    tabs={[
                        {
                            id: 'give',
                            label: t('gift.tabGive'),
                            icon: <Icon name="gift" size={16} />,
                        },
                        {
                            id: 'redeem',
                            label: t('gift.tabRedeem'),
                            icon: <Icon name="ticket" size={16} />,
                        },
                    ]}
                    value={tab}
                    onValueChange={setTab}
                    panelId="gift"
                />
            </Reveal>
            <Reveal delay={130} className="mx-auto mt-[34px] max-w-[920px]">
                <div
                    id="gift-panel"
                    role="tabpanel"
                    aria-labelledby={`gift-tab-${tab}`}
                    tabIndex={0}
                >
                    {tab === 'give' ? <GiftGivePanel /> : <GiftRedeemPanel />}
                </div>
            </Reveal>
        </MarketingSection>
    );
}
