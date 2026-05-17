import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import AdminModal from './AdminModal';
import {
    DEFAULT_LANGUAGE,
    type LocalizedString,
    type LocalizedStringList,
    SUPPORTED_LANGUAGES,
    type LanguageTag,
} from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@feature/label';

import type { AdminPlan } from '../../type/admin.types';

type PriceRow = { currency: string; amount: string };

type PlanFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        period?: string;
        priceInCents: number;
        description: LocalizedString;
        features: LocalizedStringList;
        active?: boolean;
        prices: Record<string, number>;
    }) => void;
    plan?: AdminPlan | null;
    isSubmitting: boolean;
};

const PERIOD_OPTIONS = ['DAILY', 'MONTHLY', 'ANNUAL'] as const;

const featuresMapToText = (map: LocalizedStringList, lang: LanguageTag) =>
    (map[lang] ?? []).join('\n');

const featuresTextToList = (text: string): string[] =>
    text
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

const buildInitialPrices = (plan: AdminPlan | null | undefined): PriceRow[] => {
    if (plan?.prices && Object.keys(plan.prices).length > 0) {
        return Object.entries(plan.prices).map(([currency, cents]) => ({
            currency,
            amount: (Number(cents) / 100).toFixed(2),
        }));
    }
    if (plan?.priceInCents) {
        return [
            { currency: 'BRL', amount: (plan.priceInCents / 100).toFixed(2) },
        ];
    }
    return [{ currency: 'BRL', amount: '' }];
};

const PlanFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    plan,
    isSubmitting,
}: PlanFormModalProps) => {
    const { t } = useTranslation('admin');
    const [period, setPeriod] = useState('MONTHLY');
    const [priceRows, setPriceRows] = useState<PriceRow[]>([
        { currency: 'BRL', amount: '' },
    ]);
    const [description, setDescription] = useState<LocalizedString>({});
    const [features, setFeatures] = useState<LocalizedStringList>({});
    const [featuresTab, setFeaturesTab] =
        useState<LanguageTag>(DEFAULT_LANGUAGE);
    const [active, setActive] = useState(true);

    const { data: currencyOptions = [] } = useDomainLabels(
        LABEL_TYPES.CURRENCY,
    );

    const periodLabels = useMemo<Record<string, string>>(
        () => ({
            DAILY: t('planForm.periodDaily'),
            MONTHLY: t('planForm.periodMonthly'),
            ANNUAL: t('planForm.periodAnnual'),
        }),
        [t],
    );

    useEffect(() => {
        if (plan) {
            setPeriod(plan.period);
            setPriceRows(buildInitialPrices(plan));
            setDescription({ [DEFAULT_LANGUAGE]: plan.description });
            setFeatures({ [DEFAULT_LANGUAGE]: plan.features });
            setActive(plan.active);
        } else {
            setPeriod('MONTHLY');
            setPriceRows([{ currency: 'BRL', amount: '' }]);
            setDescription({});
            setFeatures({});
            setActive(true);
        }
        setFeaturesTab(DEFAULT_LANGUAGE);
    }, [plan, isOpen]);

    const usedCurrencies = priceRows.map(r => r.currency);
    const availableCurrencyOptions = currencyOptions.filter(
        opt => !usedCurrencies.includes(opt.value),
    );

    const addPriceRow = () => {
        const next = currencyOptions.find(
            opt => !usedCurrencies.includes(opt.value),
        );
        if (next)
            setPriceRows(rows => [
                ...rows,
                { currency: next.value, amount: '' },
            ]);
    };

    const updatePriceRow = (idx: number, patch: Partial<PriceRow>) => {
        setPriceRows(rows =>
            rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
        );
    };

    const removePriceRow = (idx: number) => {
        setPriceRows(rows => rows.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const prices: Record<string, number> = {};
        for (const row of priceRows) {
            const cents = Math.round(parseFloat(row.amount) * 100);
            if (isNaN(cents) || cents <= 0) return;
            prices[row.currency] = cents;
        }
        if (Object.keys(prices).length === 0) return;

        const ptDescription = description[DEFAULT_LANGUAGE]?.trim() ?? '';
        if (!ptDescription) return;

        const priceInCents = prices['BRL'] ?? Object.values(prices)[0];

        onSubmit({
            ...(plan ? {} : { period }),
            priceInCents,
            description,
            features,
            prices,
            ...(plan ? { active } : {}),
        });
    };

    const ptDescription = description[DEFAULT_LANGUAGE]?.trim() ?? '';
    const hasValidPrices =
        priceRows.length > 0 && priceRows.every(r => r.amount !== '');

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {plan ? t('planForm.editTitle') : t('planForm.newTitle')}
                </h3>

                {!plan && (
                    <BaseSelect
                        label={t('planForm.periodLabel')}
                        variant="outlined"
                        options={PERIOD_OPTIONS.map(p => ({
                            value: p,
                            label: periodLabels[p],
                        }))}
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                    />
                )}

                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold">
                        {t('planForm.priceLabel')}
                        <span className="ml-1 text-red-500">*</span>
                    </span>

                    {priceRows.map((row, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <div className="w-36 shrink-0">
                                <BaseSelect
                                    variant="outlined"
                                    value={row.currency}
                                    onChange={e =>
                                        updatePriceRow(idx, {
                                            currency: e.target.value,
                                        })
                                    }
                                    options={[
                                        ...currencyOptions.filter(
                                            opt => opt.value === row.currency,
                                        ),
                                        ...availableCurrencyOptions,
                                    ]}
                                />
                            </div>
                            <div className="flex-1">
                                <BaseInput
                                    variant="outlined"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={row.amount}
                                    onChange={e =>
                                        updatePriceRow(idx, {
                                            amount: e.target.value,
                                        })
                                    }
                                    placeholder="0.00"
                                />
                            </div>
                            {priceRows.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removePriceRow(idx)}
                                    className="mt-1.5 p-1.5 text-red-400 border border-red-500/30 rounded-xs hover:bg-red-500/10"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {availableCurrencyOptions.length > 0 && (
                        <button
                            type="button"
                            onClick={addPriceRow}
                            className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary w-fit"
                        >
                            <FiPlus size={12} />
                            {t('planForm.addCurrency')}
                        </button>
                    )}
                </div>

                <LocalizedTextInput
                    label={t('planForm.descriptionLabel')}
                    value={description}
                    onChange={setDescription}
                    placeholder={t('planForm.descriptionPlaceholder')}
                    maxLength={300}
                />

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">
                        {t('planForm.featuresLabel')}
                        <span className="ml-1 text-red-500">*</span>
                    </span>
                    <div className="flex gap-1 border-b border-tertiary">
                        {SUPPORTED_LANGUAGES.map(lang => {
                            const filled = (features[lang] ?? []).length > 0;
                            const isActive = featuresTab === lang;
                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setFeaturesTab(lang)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'border-b-2 border-quaternary-default text-quaternary-default'
                                            : 'text-tertiary hover:text-primary'
                                    }`}
                                >
                                    {lang}
                                    {filled && (
                                        <span className="text-quaternary-default">
                                            ●
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <BaseTextArea
                        variant="outlined"
                        rows={3}
                        value={featuresMapToText(features, featuresTab)}
                        onChange={e =>
                            setFeatures({
                                ...features,
                                [featuresTab]: featuresTextToList(
                                    e.target.value,
                                ),
                            })
                        }
                        placeholder={t('planForm.featuresPlaceholder')}
                    />
                </div>

                {plan && (
                    <BaseCheckbox
                        label={t('planForm.activeLabel')}
                        checked={active}
                        onChange={setActive}
                    />
                )}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                    >
                        {t('planForm.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={
                            isSubmitting || !hasValidPrices || !ptDescription
                        }
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('planForm.saving')
                            : t('planForm.save')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default PlanFormModal;
