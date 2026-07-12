import useAppNavigate from '@shared/hook/useAppNavigate';
import { ROUTES } from '@shared/constant/ROUTES';
import { Settings } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { LegalShell } from './parts/LegalShell';
import { LegalSection } from './parts/LegalSection';
import { LegalCrossLinks } from './parts/LegalCrossLinks';
import { Card } from '@ui/Card';
import { Button } from '@ui/Button';

const SECTION_IDS = [
    'tldr',
    'coleta',
    'uso',
    'base-legal',
    'compartilhamento',
    'cookies',
    'direitos',
    'retencao',
    'seguranca',
    'criancas',
    'internacional',
    'dpo',
] as const;

type Row = { term: string; value: string };

export default function Privacy() {
    const navigate = useAppNavigate();
    const { t } = useTranslation('legal');

    const toc = SECTION_IDS.map(id => ({
        id,
        label: t(`privacy.toc.${id}`),
    }));

    const coletaRows = t('privacy.sections.coleta.rows', {
        returnObjects: true,
    }) as Row[];

    const usoItems = t('privacy.sections.uso.items', {
        returnObjects: true,
    }) as string[];

    const baseLegalItems = t('privacy.sections.base-legal.items', {
        returnObjects: true,
    }) as string[];

    const compartilhamentoItems = t('privacy.sections.compartilhamento.items', { returnObjects: true }) as string[];

    const direitosItems = t('privacy.sections.direitos.items', {
        returnObjects: true,
    }) as string[];

    const dpoRows = t('privacy.sections.dpo.rows', {
        returnObjects: true,
    }) as Row[];

    return (
        <LegalShell page="privacy" title={t('privacy.title')} sub={t('privacy.sub')} updated={t('privacy.updated')} version={t('privacy.version')} toc={toc}>
            <LegalSection id="tldr" num={1} title={t('privacy.sections.tldr.title')} tldr={t('privacy.sections.tldr.tldr')}>
                <p>{t('privacy.sections.tldr.p1')}</p>
                <p>{t('privacy.sections.tldr.p2')}</p>
            </LegalSection>

            <LegalSection id="coleta" num={2} title={t('privacy.sections.coleta.title')}>
                <p>{t('privacy.sections.coleta.lead')}</p>
                <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {coletaRows.map(row => (
                        <div key={row.term} className="rounded-mr-sm border border-mr-border bg-mr-surface p-3">
                            <dt className="mr-label text-mr-accent uppercase tracking-[0.08em]">{row.term}</dt>
                            <dd className="mt-1 text-mr-small text-mr-fg-muted">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            </LegalSection>

            <LegalSection id="uso" num={3} title={t('privacy.sections.uso.title')}>
                <p>{t('privacy.sections.uso.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {usoItems.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                <p className="mt-3">{t('privacy.sections.uso.outro')}</p>
            </LegalSection>

            <LegalSection id="base-legal" num={4} title={t('privacy.sections.base-legal.title')}>
                <p>{t('privacy.sections.base-legal.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {baseLegalItems.map((_, idx) => (
                        <li key={idx}>
                            <Trans i18nKey={`privacy.sections.base-legal.items.${idx}`} ns="legal" components={{ strong: <strong /> }} />
                        </li>
                    ))}
                </ul>
            </LegalSection>

            <LegalSection id="compartilhamento" num={5} title={t('privacy.sections.compartilhamento.title')}>
                <p>{t('privacy.sections.compartilhamento.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {compartilhamentoItems.map((_, idx) => (
                        <li key={idx}>
                            <Trans i18nKey={`privacy.sections.compartilhamento.items.${idx}`} ns="legal" components={{ strong: <strong /> }} />
                        </li>
                    ))}
                </ul>
                <p className="mt-3">{t('privacy.sections.compartilhamento.outro')}</p>
            </LegalSection>

            <LegalSection id="cookies" num={6} title={t('privacy.sections.cookies.title')}>
                <p>{t('privacy.sections.cookies.p1')}</p>
                <p>{t('privacy.sections.cookies.p2')}</p>
            </LegalSection>

            <LegalSection id="direitos" num={7} title={t('privacy.sections.direitos.title')}>
                <p>{t('privacy.sections.direitos.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {direitosItems.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                <p className="mt-3">
                    <Trans
                        i18nKey="privacy.sections.direitos.outro"
                        ns="legal"
                        components={{
                            mail: <a href="mailto:dpo@manga-reader.example.com" className="text-mr-accent underline hover:no-underline" />,
                        }}
                    />
                </p>
            </LegalSection>

            <LegalSection id="retencao" num={8} title={t('privacy.sections.retencao.title')}>
                <p>{t('privacy.sections.retencao.p1')}</p>
                <p>{t('privacy.sections.retencao.p2')}</p>
            </LegalSection>

            <LegalSection id="seguranca" num={9} title={t('privacy.sections.seguranca.title')}>
                <p>{t('privacy.sections.seguranca.p1')}</p>
                <p>{t('privacy.sections.seguranca.p2')}</p>
            </LegalSection>

            <LegalSection id="criancas" num={10} title={t('privacy.sections.criancas.title')}>
                <p>{t('privacy.sections.criancas.p1')}</p>
                <p>{t('privacy.sections.criancas.p2')}</p>
            </LegalSection>

            <LegalSection id="internacional" num={11} title={t('privacy.sections.internacional.title')}>
                <p>{t('privacy.sections.internacional.p1')}</p>
            </LegalSection>

            <LegalSection id="dpo" num={12} title={t('privacy.sections.dpo.title')}>
                <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {dpoRows.map(row => {
                        const isEmail = row.value.includes('@');

                        return (
                            <div key={row.term} className="rounded-mr-sm border border-mr-border bg-mr-surface p-3">
                                <dt className="mr-label text-mr-accent uppercase tracking-[0.08em]">{row.term}</dt>
                                <dd className="mt-1 text-mr-small text-mr-fg-muted">
                                    {isEmail ? (
                                        <a href={`mailto:${row.value}`} className="text-mr-accent underline hover:no-underline">
                                            {row.value}
                                        </a>
                                    ) : (
                                        row.value
                                    )}
                                </dd>
                            </div>
                        );
                    })}
                </dl>
            </LegalSection>

            {/* Footer card */}
            <Card variant="flat" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-mr-body font-mr-extrabold text-mr-fg">{t('privacy.footerCard.title')}</p>
                    <p className="text-mr-small text-mr-fg-muted">{t('privacy.footerCard.desc')}</p>
                </div>
                <Button variant="primary" icon={Settings} onClick={() => navigate(ROUTES.SETTINGS)} className="w-full sm:w-auto">
                    {t('privacy.footerCard.cta')}
                </Button>
            </Card>

            <LegalCrossLinks current="privacy" />
        </LegalShell>
    );
}
