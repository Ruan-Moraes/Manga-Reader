import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SubscriptionPlan } from "@manga-reader/types";
import PricingCard from "@/shared/component/PricingCard";
import { usePlans } from "@/feature/plans/hook/usePlans";

const PERIOD_ORDER = ["DAILY", "MONTHLY", "ANNUAL"];

export default function Plans() {
  const { t } = useTranslation();
  const { data: plans = [], isLoading } = usePlans();

  const sorted = [...plans].sort(
    (a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period),
  );

  function handleSelect(plan: SubscriptionPlan) {
    // Navigate to manga-reader app subscription flow
    const appUrl = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";
    window.location.href = `${appUrl}/subscription?plan=${plan.id}`;
  }

  return (
    <section id="plans" className="py-24 px-4 bg-[#252526]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("plans.title")}
          </h2>
          <p className="text-[#727273]">{t("plans.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <span className="text-[#727273]">...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {sorted.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isHighlighted={plan.period === "MONTHLY"}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
