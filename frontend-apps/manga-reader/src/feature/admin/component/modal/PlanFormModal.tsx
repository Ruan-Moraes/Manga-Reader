import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import BaseModal from '@shared/component/modal/base/BaseModal';

import type { AdminPlan } from '../type/admin.types';

type PlanFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        period?: string;
        priceInCents: number;
        description: string;
        features: string[];
        active?: boolean;
    }) => void;
    plan?: AdminPlan | null;
    isSubmitting: boolean;
};

const PERIOD_OPTIONS = ['DAILY', 'MONTHLY', 'ANNUAL'] as const;

const PlanFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    plan,
    isSubmitting,
}: PlanFormModalProps) => {
    const { t } = useTranslation('admin');
    const [period, setPeriod] = useState('MONTHLY');
    const [priceReais, setPriceReais] = useState('');
    const [description, setDescription] = useState('');
    const [features, setFeatures] = useState('');
    const [active, setActive] = useState(true);

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
            setPriceReais((plan.priceInCents / 100).toFixed(2));
            setDescription(plan.description);
            setFeatures(plan.features.join('\n'));
            setActive(plan.active);
        } else {
            setPeriod('MONTHLY');
            setPriceReais('');
            setDescription('');
            setFeatures('');
            setActive(true);
        }
    }, [plan, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceInCents = Math.round(parseFloat(priceReais) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0) return;

        const featureList = features
            .split('\n')
            .map(f => f.trim())
            .filter(Boolean);

        onSubmit({
            ...(plan ? {} : { period }),
            priceInCents,
            description,
            features: featureList,
            ...(plan ? { active } : {}),
        });
    };

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-2">
                <h3 className="text-sm font-bold">
                    {plan
                        ? t('planForm.editTitle')
                        : t('planForm.newTitle')}
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

                <BaseInput
                    label={t('planForm.priceLabel')}
                    variant="outlined"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={priceReais}
                    onChange={e => setPriceReais(e.target.value)}
                    placeholder={t('planForm.pricePlaceholder')}
                />

                <BaseInput
                    label={t('planForm.descriptionLabel')}
                    variant="outlined"
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={300}
                    placeholder={t('planForm.descriptionPlaceholder')}
                />

                <BaseTextArea
                    label={t('planForm.featuresLabel')}
                    variant="outlined"
                    value={features}
                    onChange={e => setFeatures(e.target.value)}
                    rows={3}
                    placeholder={t('planForm.featuresPlaceholder')}
                />

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
                        disabled={isSubmitting || !priceReais || !description}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('planForm.saving')
                            : t('planForm.save')}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default PlanFormModal;
