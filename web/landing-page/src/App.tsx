import { useTranslation } from 'react-i18next';

import Footer from '@/shared/component/Footer';
import Header from '@/shared/component/Header';
import PreferenceRail from '@/shared/component/PreferenceRail';

import Benefits from '@/section/Benefits';
import Compare from '@/section/Compare';
import Demo from '@/section/Demo';
import FAQ from '@/section/FAQ';
import Final from '@/section/Final';
import Gift from '@/section/Gift';
import Hero from '@/section/Hero';
import MobileApp from '@/section/MobileApp';
import Plans from '@/section/Plans';
import Stats from '@/section/Stats';
import Testimonials from '@/section/Testimonials';

export default function App() {
    const { t } = useTranslation();

    return (
        <>
            <a
                className="fixed top-3 left-3 z-[200] -translate-y-[150%] cursor-pointer rounded bg-accent px-3.5 py-2.5 font-extrabold text-on-accent no-underline shadow-[0_8px_20px_rgb(221_218_42_/_18%)] transition-[translate,scale,box-shadow] duration-150 focus:translate-y-0 focus:shadow-[0_12px_26px_rgb(221_218_42_/_28%)] active:scale-[0.98]"
                href="#main-content"
            >
                {t('nav.skipToContent')}
            </a>
            <Header />
            <PreferenceRail />
            <main id="main-content" tabIndex={-1}>
                <Hero />
                <Demo />
                <Benefits />
                <MobileApp />
                <Stats />
                <Plans />
                <Compare />
                <Gift />
                <Testimonials />
                <FAQ />
                <Final />
            </main>
            <Footer />
        </>
    );
}
