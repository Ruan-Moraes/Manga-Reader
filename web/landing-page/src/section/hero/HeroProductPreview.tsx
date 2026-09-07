import { useTranslation } from 'react-i18next';

import { BrowserFrame, PhoneFrame } from '@/shared/component/DeviceFrames';
import { LibraryScreen, ReaderScreen } from '@/shared/component/mock-screen';
import FloatingStatusChip from '@/section/hero/FloatingStatusChip';

export default function HeroProductPreview() {
    const { t } = useTranslation();

    return (
        <div className="relative isolate mx-auto w-[min(100%,900px)] py-3 pb-7">
            <div className="relative z-[1] min-w-0 md:pt-[46px] lg:w-[88%] lg:pb-[46px] motion-safe:animate-float-a">
                <div className="w-full min-w-0">
                    <BrowserFrame label={t('hero.previewLabel')}>
                        <div className="h-[clamp(270px,42vw,430px)] overflow-hidden">
                            <LibraryScreen />
                        </div>
                    </BrowserFrame>
                </div>
                <FloatingStatusChip
                    icon="zap"
                    label={t('hero.floatNew')}
                    accent
                    className="top-0 left-[clamp(12px,5%,32px)] hidden md:inline-flex"
                />
                <FloatingStatusChip
                    icon="play"
                    label={t('hero.floatContinue')}
                    className="bottom-0 left-[clamp(24px,18%,120px)] hidden lg:inline-flex"
                />
            </div>
            <div className="absolute right-0 bottom-[6px] z-[3] hidden lg:block motion-safe:animate-float-b">
                <PhoneFrame w={210} label={t('hero.phonePreviewLabel')}>
                    <ReaderScreen />
                </PhoneFrame>
            </div>
            <FloatingStatusChip
                icon="check"
                label={t('hero.floatSync')}
                className="top-2.5 right-[clamp(12px,3%,24px)] z-[4] hidden lg:inline-flex motion-safe:animate-float-b"
            />
        </div>
    );
}
