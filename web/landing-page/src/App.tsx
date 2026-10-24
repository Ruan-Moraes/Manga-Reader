import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import Footer from '@/shared/component/Footer';
import Header from '@/shared/component/Header';
import PreferenceRail from '@/shared/component/PreferenceRail';

import Hero from '@/section/Hero';
import Translation from '@/section/Translation';

const Demo = lazy(() => import('@/section/Demo'));
const Benefits = lazy(() => import('@/section/Benefits'));
const MobileApp = lazy(() => import('@/section/MobileApp'));
const Stats = lazy(() => import('@/section/Stats'));
const Plans = lazy(() => import('@/section/Plans'));
const Compare = lazy(() => import('@/section/Compare'));
const Gift = lazy(() => import('@/section/Gift'));
const Testimonials = lazy(() => import('@/section/Testimonials'));
const FAQ = lazy(() => import('@/section/FAQ'));
const Final = lazy(() => import('@/section/Final'));

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
                <Translation />
                <Suspense fallback={null}>
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
                </Suspense>
            </main>
            <Footer />
        </>
    );
}
