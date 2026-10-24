import { useTranslation } from 'react-i18next';
import Icon from '@/shared/component/Icon';
import Reveal from '@/shared/component/Reveal';
import { COMPARE_ROWS } from '@/shared/data/compare';
import { CompareCell } from './CompareCell';

interface CompareTableProps {
    features: string[];
}

export function CompareTable({ features }: CompareTableProps) {
    const { t } = useTranslation();

    return (
        <Reveal
            delay={80}
            className="mx-auto mt-[42px] max-w-[800px] overflow-x-auto rounded-[14px] border border-border-strong"
        >
            <table className="w-full min-w-[520px] table-fixed border-collapse bg-secondary [&_td]:border-b [&_td]:border-border [&_td]:px-5 [&_td]:py-[15px] [&_td]:align-middle [&_td]:text-center [&_td]:text-accent-fg [&_td:nth-child(2)]:text-tertiary [&_th]:border-b [&_th]:border-border [&_th]:px-5 [&_th]:py-[15px] [&_th]:text-center [&_th]:align-middle [&_th:first-child]:w-1/2 [&_th:not(:first-child)]:w-1/4 [&_thead_th]:text-xs [&_thead_th]:font-black [&_thead_th]:uppercase [&_thead_th]:tracking-[0.08em] [&_thead_th]:text-copy-muted [&_thead_th:last-child>span]:inline-flex [&_thead_th:last-child>span]:items-center [&_thead_th:last-child>span]:gap-1.5 [&_thead_th:last-child>span]:rounded-full [&_thead_th:last-child>span]:border [&_thead_th:last-child>span]:border-accent-muted [&_thead_th:last-child>span]:bg-accent-subtle [&_thead_th:last-child>span]:px-[11px] [&_thead_th:last-child>span]:py-[5px] [&_thead_th:last-child>span]:text-accent-fg [&_tbody_th]:text-[0.875rem] [&_tbody_th]:font-bold [&_tbody_th]:text-fg [&_tbody_tr:nth-child(even)]:bg-card [&_tbody_tr:last-child>*]:border-b-0">
                <thead>
                    <tr>
                        <th>{t('compare.colFeature')}</th>
                        <th>{t('compare.colFree')}</th>
                        <th>
                            <span>
                                <Icon name="zap" size={13} />
                                {t('compare.colPremium')}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((feature, index) => (
                        <tr key={feature}>
                            <th scope="row">{feature}</th>
                            <td>
                                <CompareCell
                                    value={COMPARE_ROWS[index].free}
                                    limited={t('compare.limited')}
                                    yes={t('compare.yes')}
                                    no={t('compare.no')}
                                />
                            </td>
                            <td>
                                <CompareCell
                                    value={COMPARE_ROWS[index].premium}
                                    limited={t('compare.limited')}
                                    yes={t('compare.yes')}
                                    no={t('compare.no')}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Reveal>
    );
}

export default CompareTable;
