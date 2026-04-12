import { useTranslation } from "react-i18next";
import AnimatedCounter from "@/shared/component/AnimatedCounter";
import { usePublicStats } from "@/feature/stats/hook/usePublicStats";

export default function Catalog() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = usePublicStats();

  return (
    <section id="catalog" className="py-24 px-4 bg-[#252526]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-16">
          {t("catalog.title")}
        </h2>

        {isLoading ? (
          <p className="text-[#727273]">{t("catalog.loading")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-2">
              <AnimatedCounter
                target={stats?.totalTitles ?? 0}
                className="text-6xl font-extrabold text-[#ddda2a]"
                suffix="+"
              />
              <p className="text-[#727273] text-lg">
                {t("catalog.works_label")}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AnimatedCounter
                target={stats?.totalChapters ?? 0}
                className="text-6xl font-extrabold text-[#ddda2a]"
                suffix="+"
              />
              <p className="text-[#727273] text-lg">
                {t("catalog.chapters_label")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
