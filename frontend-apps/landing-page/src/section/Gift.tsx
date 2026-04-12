import { useState } from "react";
import { useTranslation } from "react-i18next";

type Tab = "give" | "redeem";

const APP_URL = import.meta.env.VITE_APP_URL ?? "";

export default function Gift() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("give");
  const [code, setCode] = useState("");

  function handleRedeemRedirect() {
    const trimmed = code.trim();
    const target = trimmed
      ? `${APP_URL}/subscription/redeem?code=${encodeURIComponent(trimmed)}`
      : `${APP_URL}/subscription/redeem`;
    window.location.href = target;
  }

  return (
    <section id="gift" className="py-24 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("gift.title")}
          </h2>
          <p className="text-[#727273]">{t("gift.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-[#252526] p-1 mb-8">
          {(["give", "redeem"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-[#ddda2a] text-[#161616]"
                  : "text-[#727273] hover:text-white"
              }`}
            >
              {t(`gift.tab_${tab}`)}
            </button>
          ))}
        </div>

        {activeTab === "give" ? (
          <div className="space-y-6 text-center">
            <p className="text-[#727273] text-sm leading-relaxed">
              {t("gift.give.description")}
            </p>
            <a
              href={`${APP_URL}/subscription?action=gift`}
              className="block w-full rounded-lg bg-[#ddda2a] py-3 font-bold text-[#161616] hover:bg-[#c9c726] transition-colors text-center"
            >
              {t("gift.give.cta")}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                {t("gift.redeem.code_label")}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("gift.redeem.code_placeholder")}
                className="w-full rounded-lg bg-[#252526] border border-[#727273] px-3 py-2 text-white placeholder-[#727273] focus:border-[#ddda2a] focus:outline-none font-mono"
              />
            </div>
            <button
              onClick={handleRedeemRedirect}
              className="w-full rounded-lg bg-[#ddda2a] py-3 font-bold text-[#161616] hover:bg-[#c9c726] transition-colors"
            >
              {t("gift.redeem.cta")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
