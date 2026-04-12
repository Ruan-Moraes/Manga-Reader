import Header from '@/shared/component/Header';
import Footer from '@/shared/component/Footer';

import Hero from '@/section/Hero';
import Benefits from '@/section/Benefits';
import Catalog from '@/section/Catalog';
import Features from '@/section/Features';
import Plans from '@/section/Plans';
import Gift from '@/section/Gift';
import Testimonials from '@/section/Testimonials';
import FAQ from '@/section/FAQ';
import FooterCTA from '@/section/FooterCTA';

export default function App() {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <Benefits />
                <Catalog />
                <Features />
                <Plans />
                <Gift />
                <Testimonials />
                <FAQ />
                <FooterCTA />
            </main>
            <Footer />
        </>
    );
}
