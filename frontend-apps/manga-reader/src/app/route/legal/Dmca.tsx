import useAppNavigate from '@shared/hook/useAppNavigate';
import { Bell, AlertTriangle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { LegalShell } from './_components/LegalShell';
import { LegalSection } from './_components/LegalSection';
import { LegalCrossLinks } from './_components/LegalCrossLinks';
import { Card } from '@ui/Card';
import { Button } from '@ui/Button';

const SECTION_IDS = [
    'oque-e',
    'quem-pode',
    'como-pedir',
    'informacoes',
    'prazo',
    'contra',
    'reincidencia',
    'agente',
] as const;

type Row = { term: string; value: string };

export default function Dmca() {
    const navigate = useAppNavigate();
    const { t } = useTranslation('legal');

    const toc = SECTION_IDS.map(id => ({
        id,
        label: t(`dmca.toc.${id}`),
    }));

    const quemPodeItems = t('dmca.sections.quem-pode.items', {
        returnObjects: true,
    }) as string[];

    const informacoesItems = t('dmca.sections.informacoes.items', {
        returnObjects: true,
    }) as string[];

    const prazoItems = t('dmca.sections.prazo.items', {
        returnObjects: true,
    }) as string[];

    const contraItems = t('dmca.sections.contra.items', {
        returnObjects: true,
    }) as string[];

    const agenteRows = t('dmca.sections.agente.rows', {
        returnObjects: true,
    }) as Row[];

    return (
        <LegalShell
            page="dmca"
            title={t('dmca.title')}
            sub={t('dmca.sub')}
            updated={t('dmca.updated')}
            version={t('dmca.version')}
            toc={toc}
        >
            <LegalSection
                id="oque-e"
                num={1}
                title={t('dmca.sections.oque-e.title')}
                tldr={t('dmca.sections.oque-e.tldr')}
            >
                <p>{t('dmca.sections.oque-e.p1')}</p>
                <p>{t('dmca.sections.oque-e.p2')}</p>
            </LegalSection>

            <LegalSection
                id="quem-pode"
                num={2}
                title={t('dmca.sections.quem-pode.title')}
            >
                <p>{t('dmca.sections.quem-pode.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {quemPodeItems.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                <p className="mt-3">{t('dmca.sections.quem-pode.outro')}</p>
            </LegalSection>

            <LegalSection
                id="como-pedir"
                num={3}
                title={t('dmca.sections.como-pedir.title')}
            >
                <p>{t('dmca.sections.como-pedir.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    <li>
                        <strong>
                            {t('dmca.sections.como-pedir.emailLabel')}
                        </strong>{' '}
                        <a
                            href={`mailto:${t('dmca.sections.como-pedir.emailAddress')}`}
                            className="text-mr-accent underline hover:no-underline"
                        >
                            {t('dmca.sections.como-pedir.emailAddress')}
                        </a>
                    </li>
                    <li>
                        <strong>
                            {t('dmca.sections.como-pedir.channelLabel')}
                        </strong>{' '}
                        <a
                            onClick={() => navigate('/legal/contact')}
                            className="cursor-pointer text-mr-accent underline hover:no-underline"
                        >
                            {t('dmca.sections.como-pedir.channelLinkText')}
                        </a>
                    </li>
                </ul>
                <p className="mt-3">{t('dmca.sections.como-pedir.outro')}</p>
            </LegalSection>

            <LegalSection
                id="informacoes"
                num={4}
                title={t('dmca.sections.informacoes.title')}
            >
                <p>{t('dmca.sections.informacoes.lead')}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-mr-fg-muted">
                    {informacoesItems.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ol>

                <aside className="mt-4 flex gap-3 rounded-mr-sm border border-mr-danger/40 border-l-[3px] border-l-mr-danger bg-[rgba(255,120,79,0.06)] p-3">
                    <AlertTriangle className="size-4 shrink-0 text-mr-danger mt-0.5" />
                    <p className="text-mr-small text-[#ffb59c]">
                        <strong>
                            {t('dmca.sections.informacoes.warningTitle')}
                        </strong>{' '}
                        {t('dmca.sections.informacoes.warningBody')}
                    </p>
                </aside>
            </LegalSection>

            <LegalSection
                id="prazo"
                num={5}
                title={t('dmca.sections.prazo.title')}
            >
                <p>{t('dmca.sections.prazo.lead')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {prazoItems.map((_, idx) => (
                        <li key={idx}>
                            <Trans
                                i18nKey={`dmca.sections.prazo.items.${idx}`}
                                ns="legal"
                                components={{ strong: <strong /> }}
                            />
                        </li>
                    ))}
                </ul>
                <p className="mt-3">{t('dmca.sections.prazo.outro')}</p>
            </LegalSection>

            <LegalSection
                id="contra"
                num={6}
                title={t('dmca.sections.contra.title')}
            >
                <p>{t('dmca.sections.contra.p1')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mr-fg-muted">
                    {contraItems.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                <p className="mt-3">{t('dmca.sections.contra.outro')}</p>
            </LegalSection>

            <LegalSection
                id="reincidencia"
                num={7}
                title={t('dmca.sections.reincidencia.title')}
            >
                <p>
                    <Trans
                        i18nKey="dmca.sections.reincidencia.p1"
                        ns="legal"
                        components={{ strong: <strong /> }}
                    />
                </p>
                <p>{t('dmca.sections.reincidencia.p2')}</p>
            </LegalSection>

            <LegalSection
                id="agente"
                num={8}
                title={t('dmca.sections.agente.title')}
            >
                <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {agenteRows.map(row => {
                        const isEmail =
                            row.value.includes('@') &&
                            !row.value.includes(' ');

                        return (
                            <div
                                key={row.term}
                                className="rounded-mr-sm border border-mr-border bg-mr-surface p-3"
                            >
                                <dt className="mr-label text-mr-accent uppercase tracking-[0.08em]">
                                    {row.term}
                                </dt>
                                <dd className="mt-1 text-mr-small text-mr-fg-muted">
                                    {isEmail ? (
                                        <a
                                            href={`mailto:${row.value}`}
                                            className="text-mr-accent underline hover:no-underline"
                                        >
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
            <Card
                variant="flat"
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <p className="text-mr-body font-mr-extrabold text-mr-fg">
                        {t('dmca.footerCard.title')}
                    </p>
                    <p className="text-mr-small text-mr-fg-muted">
                        {t('dmca.footerCard.desc')}
                    </p>
                </div>
                <Button
                    variant="primary"
                    icon={Bell}
                    onClick={() => navigate('/legal/contact')}
                >
                    {t('dmca.footerCard.cta')}
                </Button>
            </Card>

            <LegalCrossLinks current="dmca" />
        </LegalShell>
    );
}
