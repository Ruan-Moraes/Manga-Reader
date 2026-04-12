import { useTranslation } from "react-i18next";

export default function FooterCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-4 bg-[#252526]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">
          {t("footer_cta.headline")}
        </h2>
        <p className="text-[#727273] mb-10">{t("footer_cta.subheadline")}</p>
        <a
          href="#plans"
          className="inline-block rounded-lg bg-[#ddda2a] px-10 py-4 font-bold text-lg text-[#161616] hover:bg-[#c9c726] transition-colors"
        >
          {t("footer_cta.cta")}
        </a>
      </div>
    </section>
  );
}
