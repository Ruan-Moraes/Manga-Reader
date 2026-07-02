import Footer from '@/shared/component/Footer';
import Header from '@/shared/component/Header';

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
    return (
        <>
            <Header />
            <main>
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
