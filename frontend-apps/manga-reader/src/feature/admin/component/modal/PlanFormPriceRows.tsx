import { useTranslation } from 'react-i18next';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Plus, Trash2 } from 'lucide-react';

export type PriceRow = { currency: string; amount: string };

type CurrencyOption = { value: string; label: string };

type PlanFormPriceRowsProps = {
    rows: PriceRow[];
    currencyOptions: CurrencyOption[];
    onChange: (rows: PriceRow[]) => void;
};

const PlanFormPriceRows = ({ rows, currencyOptions, onChange }: PlanFormPriceRowsProps) => {
    const { t } = useTranslation('admin');

    const usedCurrencies = rows.map(r => r.currency);
    const availableCurrencyOptions = currencyOptions.filter(opt => !usedCurrencies.includes(opt.value));

    const addPriceRow = () => {
        const next = availableCurrencyOptions[0];
        if (next) onChange([...rows, { currency: next.value, amount: '' }]);
    };

    const updatePriceRow = (idx: number, patch: Partial<PriceRow>) => {
        onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };

    const removePriceRow = (idx: number) => {
        onChange(rows.filter((_, i) => i !== idx));
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-bold">
                {t('planForm.priceLabel')}
                <span className="ml-1 text-red-500">*</span>
            </span>

            {rows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                    <div className="w-36 shrink-0">
                        <Select
                            value={row.currency}
                            onChange={e =>
                                updatePriceRow(idx, {
                                    currency: e.target.value,
                                })
                            }
                            options={[...currencyOptions.filter(opt => opt.value === row.currency), ...availableCurrencyOptions]}
                        />
                    </div>
                    <div className="flex-1">
                        <Input
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
                    {rows.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removePriceRow(idx)}
                            className="mt-1.5 p-1.5 text-red-400 border border-red-500/30 rounded-xs hover:bg-red-500/10"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            ))}

            {availableCurrencyOptions.length > 0 && (
                <button type="button" onClick={addPriceRow} className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary w-fit">
                    <Plus size={12} />
                    {t('planForm.addCurrency')}
                </button>
            )}
        </div>
    );
};

export default PlanFormPriceRows;
