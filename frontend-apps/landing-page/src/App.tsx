import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/shared/component/LanguageSwitcher";
import Hero from "@/section/Hero";
import Benefits from "@/section/Benefits";
import Catalog from "@/section/Catalog";
import Features from "@/section/Features";
import Plans from "@/section/Plans";
import Gift from "@/section/Gift";
import Testimonials from "@/section/Testimonials";
import FAQ from "@/section/FAQ";
import FooterCTA from "@/section/FooterCTA";

export default function App() {
  const { t } = useTranslation();

  return (
    <>
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 border-b border-[#252526] bg-[#161616]/90 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-xl font-extrabold text-[#ddda2a]">
            Manga Reader
          </span>

          <div className="hidden sm:flex items-center gap-6 text-sm text-[#727273]">
            <a href="#benefits" className="hover:text-white transition-colors">
              {t("nav.benefits")}
            </a>
            <a href="#plans" className="hover:text-white transition-colors">
              {t("nav.plans")}
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              {t("nav.faq")}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href="#plans"
              className="hidden sm:inline-block rounded-lg bg-[#ddda2a] px-4 py-2 text-sm font-bold text-[#161616] hover:bg-[#c9c726] transition-colors"
            >
              {t("nav.cta")}
            </a>
          </div>
        </nav>
      </header>

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

      <footer className="border-t border-[#252526] py-8 text-center text-sm text-[#727273]">
        © {new Date().getFullYear()} Manga Reader. Todos os direitos reservados.
      </footer>
    </>
  );
}
