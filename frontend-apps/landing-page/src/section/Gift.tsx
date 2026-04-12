import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Tab = 'give' | 'redeem';

const APP_URL = import.meta.env.VITE_APP_URL ?? '';

export default function Gift() {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<Tab>('give');

    const [code, setCode] = useState('');

    function handleRedeemRedirect() {
        const trimmed = code.trim();

        const target = trimmed
            ? `${APP_URL}/subscription/redeem?code=${encodeURIComponent(trimmed)}`
            : `${APP_URL}/subscription/redeem`;

        window.location.href = target;
    }

    return (
        <section id="gift" className="px-4 py-24">
            <div className="max-w-lg mx-auto">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-white">
                        {t('gift.title')}
                    </h2>
                    <p className="text-tertiary">{t('gift.subtitle')}</p>
                </div>
                <div className="flex p-1 mb-8 rounded-lg bg-secondary">
                    {(['give', 'redeem'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                                activeTab === tab
                                    ? 'bg-accent text-primary'
                                    : 'text-tertiary hover:text-white'
                            }`}
                        >
                            {t(`gift.tab_${tab}`)}
                        </button>
                    ))}
                </div>
                {activeTab === 'give' ? (
                    <div className="space-y-6 text-center">
                        <p className="text-sm leading-relaxed text-tertiary">
                            {t('gift.give.description')}
                        </p>
                        <a
                            href={`${APP_URL}/subscription?action=gift`}
                            className="block w-full py-3 font-bold text-center transition-colors rounded-lg bg-accent text-primary hover:bg-accent-hover"
                        >
                            {t('gift.give.cta')}
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-white">
                                {t('gift.redeem.code_label')}
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder={t('gift.redeem.code_placeholder')}
                                className="w-full px-3 py-2 font-mono text-white border rounded-lg bg-secondary border-tertiary placeholder-tertiary focus:border-accent focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleRedeemRedirect}
                            className="w-full py-3 font-bold transition-colors rounded-lg cursor-pointer bg-accent text-primary hover:bg-accent-hover"
                        >
                            {t('gift.redeem.cta')}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
