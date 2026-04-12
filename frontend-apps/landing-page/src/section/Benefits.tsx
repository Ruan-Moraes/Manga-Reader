import { useTranslation } from "react-i18next";

const BENEFIT_ICONS: Record<string, string> = {
  library: "📚",
  updates: "⚡",
  multiplatform: "🖥️",
  offline: "✈️",
};

export default function Benefits() {
  const { t } = useTranslation();
  const keys = ["library", "updates", "multiplatform", "offline"] as const;

  return (
    <section id="benefits" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          {t("benefits.title")}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {keys.map((key) => (
            <div
              key={key}
              className="rounded-2xl bg-[#252526] border border-[#727273] p-6 flex flex-col gap-3 hover:border-[#ddda2a40] transition-colors"
            >
              <span className="text-3xl">{BENEFIT_ICONS[key]}</span>
              <h3 className="text-base font-bold text-white">
                {t(`benefits.items.${key}.title`)}
              </h3>
              <p className="text-sm text-[#727273] leading-relaxed">
                {t(`benefits.items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
