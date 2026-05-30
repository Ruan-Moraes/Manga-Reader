import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@ui/Checkbox';
import { Select } from '@ui/Select';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString, type LocalizedStringList } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@feature/label';

import FormModal from './FormModal';
import PlanFormPriceRows, { type PriceRow } from './PlanFormPriceRows';
import PlanFormFeaturesInput from './PlanFormFeaturesInput';

import type { AdminPlan } from '../../type/admin.types';

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

const buildInitialPrices = (plan: AdminPlan | null | undefined): PriceRow[] => {
    if (plan?.prices && Object.keys(plan.prices).length > 0) {
        return Object.entries(plan.prices).map(([currency, cents]) => ({
            currency,
            amount: (Number(cents) / 100).toFixed(2),
        }));
    }
    if (plan?.priceInCents) {
        return [{ currency: 'BRL', amount: (plan.priceInCents / 100).toFixed(2) }];
    }
    return [{ currency: 'BRL', amount: '' }];
};

const PlanFormModal = ({ isOpen, onClose, onSubmit, plan, isSubmitting }: PlanFormModalProps) => {
    const { t } = useTranslation('admin');
    const [period, setPeriod] = useState('MONTHLY');
    const [priceRows, setPriceRows] = useState<PriceRow[]>([{ currency: 'BRL', amount: '' }]);
    const [description, setDescription] = useState<LocalizedString>({});
    const [features, setFeatures] = useState<LocalizedStringList>({});
    const [active, setActive] = useState(true);

    const { data: currencyOptions = [] } = useDomainLabels(LABEL_TYPES.CURRENCY);

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
    }, [plan, isOpen]);

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
    const hasValidPrices = priceRows.length > 0 && priceRows.every(r => r.amount !== '');

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={plan ? t('planForm.editTitle') : t('planForm.newTitle')}
            onSubmit={handleSubmit}
            submitLabel={t('planForm.save')}
            submittingLabel={t('planForm.saving')}
            cancelLabel={t('planForm.cancel')}
            isSubmitting={isSubmitting}
            submitDisabled={!hasValidPrices || !ptDescription}
        >
            {!plan && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('planForm.periodLabel')}</span>
                    <Select
                        options={PERIOD_OPTIONS.map(p => ({
                            value: p,
                            label: periodLabels[p],
                        }))}
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                    />
                </div>
            )}

            <PlanFormPriceRows rows={priceRows} currencyOptions={currencyOptions} onChange={setPriceRows} />

            <LocalizedTextInput
                label={t('planForm.descriptionLabel')}
                value={description}
                onChange={setDescription}
                placeholder={t('planForm.descriptionPlaceholder')}
                maxLength={300}
            />

            <PlanFormFeaturesInput value={features} onChange={setFeatures} />

            {plan && <Checkbox label={t('planForm.activeLabel')} checked={active} onChange={e => setActive(e.target.checked)} />}
        </FormModal>
    );
};

export default PlanFormModal;
