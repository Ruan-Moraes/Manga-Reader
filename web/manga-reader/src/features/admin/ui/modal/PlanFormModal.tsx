import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Switch } from '@ui/Switch';
import { Select } from '@ui/Select';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString, type LocalizedStringList } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';

import PlanFormPriceRows, { type PriceRow } from './PlanFormPriceRows';
import PlanFormFeaturesInput from './PlanFormFeaturesInput';

import type { AdminPlan } from '../../model/admin.types';

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

    const handleSave = () => {
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
        <Modal
            open={isOpen}
            onClose={onClose}
            title={plan ? t('planForm.editTitle') : t('planForm.newTitle')}
            size="lg"
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('planForm.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={!hasValidPrices || !ptDescription} loading={isSubmitting} onClick={handleSave}>
                        {isSubmitting ? t('planForm.saving') : t('planForm.save')}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4 p-2">
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

            {plan && <Switch label={t('planForm.activeLabel')} checked={active} onChange={setActive} />}
            </div>
        </Modal>
    );
};

export default PlanFormModal;
