import type { SubscriptionPlan } from "@manga-reader/types";
import { useTranslation } from "react-i18next";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isHighlighted?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

function formatPrice(cents: number, locale = "pt-BR"): string {
  return (cents / 100).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

const PERIOD_SUFFIX_KEY: Record<string, string> = {
  DAILY: "plans.per_day",
  MONTHLY: "plans.per_month",
  ANNUAL: "plans.per_year",
};

export default function PricingCard({
  plan,
  isHighlighted = false,
  onSelect,
}: PricingCardProps) {
  const { t } = useTranslation();
  const suffixKey = PERIOD_SUFFIX_KEY[plan.period] ?? "plans.per_month";

  return (
    <article
      className={`relative flex flex-col rounded-2xl p-6 border transition-all ${
        isHighlighted
          ? "bg-[#252526] border-[#ddda2a] shadow-[0.25rem_0.25rem_0_0_#ddda2a40]"
          : "bg-[#252526] border-[#727273]"
      }`}
    >
      {isHighlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ddda2a] px-3 py-0.5 text-xs font-bold text-[#161616]">
          {t("plans.most_popular")}
        </span>
      )}

      <h3 className="text-lg font-bold capitalize text-white mb-1">
        {t(`plans.period.${plan.period.toLowerCase()}`)}
      </h3>

      <div className="mt-2 mb-4">
        <span className="text-4xl font-extrabold text-[#ddda2a]">
          {formatPrice(plan.priceInCents)}
        </span>
        <span className="text-[#727273] ml-1 text-sm">{t(suffixKey)}</span>
      </div>

      <p className="text-[#727273] text-sm mb-4">{plan.description}</p>

      <ul className="flex-1 space-y-2 mb-6">
        <li className="text-xs font-semibold uppercase tracking-wider text-[#727273]">
          {t("plans.feature_list_title")}
        </li>
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm text-white"
          >
            <span className="text-[#ddda2a]">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        className={`w-full rounded-lg py-3 font-bold text-sm transition-colors ${
          isHighlighted
            ? "bg-[#ddda2a] text-[#161616] hover:bg-[#c9c726]"
            : "bg-transparent border border-[#ddda2a] text-[#ddda2a] hover:bg-[#ddda2a20]"
        }`}
      >
        {t("plans.cta")}
      </button>
    </article>
  );
}
