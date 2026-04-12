import { useTranslation } from "react-i18next";
import Badge from "@/shared/component/Badge";

const FEATURE_ICONS: Record<string, string> = {
  web: "🌐",
  ios: "🍎",
  android: "🤖",
  offline: "✈️",
  no_ads: "🚫",
  hd: "🔍",
};

export default function Features() {
  const { t } = useTranslation();
  const keys = ["web", "ios", "android", "offline", "no_ads", "hd"] as const;

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-12">
          {t("features.title")}
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {keys.map((key) => (
            <Badge
              key={key}
              icon={<span>{FEATURE_ICONS[key]}</span>}
              label={t(`features.badges.${key}`)}
              variant={
                key === "offline" || key === "no_ads" ? "highlight" : "default"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
