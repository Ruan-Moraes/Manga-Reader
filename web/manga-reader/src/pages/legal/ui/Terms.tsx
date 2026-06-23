import useAppNavigate from '@shared/hook/useAppNavigate';
import { ROUTES } from '@shared/constant/ROUTES';
import { MessageCircle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { LegalShell } from './parts/LegalShell';
import { LegalSection } from './parts/LegalSection';
import { LegalCrossLinks } from './parts/LegalCrossLinks';
import { Card } from '@ui/Card';
import { Button } from '@ui/Button';

const SECTION_IDS = ['aceite', 'conta', 'uso', 'comunidade', 'direitos-autorais', 'pagamentos', 'encerramento', 'isencoes', 'mudancas', 'lei'] as const;

export default function Terms() {
    const navigate = useAppNavigate();
    const { t } = useTranslation('legal');

    const toc = SECTION_IDS.map(id => ({
        id,
        label: t(`terms.toc.${id}`),
    }));

    return (
        <LegalShell page="terms" title={t('terms.title')} sub={t('terms.sub')} updated={t('terms.updated')} version={t('terms.version')} toc={toc}>
            <LegalSection id="aceite" num={1} title={t('terms.sections.aceite.title')} tldr={t('terms.sections.aceite.tldr')}>
                <p>{t('terms.sections.aceite.p1')}</p>
                <p>{t('terms.sections.aceite.p2')}</p>
                <p>{t('terms.sections.aceite.p3')}</p>
            </LegalSection>

            <LegalSection id="conta" num={2} title={t('terms.sections.conta.title')} tldr={t('terms.sections.conta.tldr')}>
                <p>{t('terms.sections.conta.p1')}</p>
                <p>{t('terms.sections.conta.p2')}</p>
                <p>
                    <Trans i18nKey="terms.sections.conta.p3" ns="legal" components={{ strong: <strong /> }} />
                </p>
            </LegalSection>

            <LegalSection id="uso" num={3} title={t('terms.sections.uso.title')} tldr={t('terms.sections.uso.tldr')}>
                <p>{t('terms.sections.uso.p1')}</p>
                <p>{t('terms.sections.uso.p2')}</p>
            </LegalSection>

            <LegalSection id="comunidade" num={4} title={t('terms.sections.comunidade.title')} tldr={t('terms.sections.comunidade.tldr')}>
                <p>{t('terms.sections.comunidade.p1')}</p>
                <p>{t('terms.sections.comunidade.p2')}</p>
                <p>{t('terms.sections.comunidade.p3')}</p>
            </LegalSection>

            <LegalSection id="direitos-autorais" num={5} title={t('terms.sections.direitos-autorais.title')} tldr={t('terms.sections.direitos-autorais.tldr')}>
                <p>{t('terms.sections.direitos-autorais.p1')}</p>
                <p>
                    <Trans i18nKey="terms.sections.direitos-autorais.p2" ns="legal" components={{ strong: <strong /> }} />
                </p>
            </LegalSection>

            <LegalSection id="pagamentos" num={6} title={t('terms.sections.pagamentos.title')} tldr={t('terms.sections.pagamentos.tldr')}>
                <p>{t('terms.sections.pagamentos.p1')}</p>
                <p>{t('terms.sections.pagamentos.p2')}</p>
            </LegalSection>

            <LegalSection id="encerramento" num={7} title={t('terms.sections.encerramento.title')} tldr={t('terms.sections.encerramento.tldr')}>
                <p>{t('terms.sections.encerramento.p1')}</p>
                <p>{t('terms.sections.encerramento.p2')}</p>
            </LegalSection>

            <LegalSection id="isencoes" num={8} title={t('terms.sections.isencoes.title')} tldr={t('terms.sections.isencoes.tldr')}>
                <p>{t('terms.sections.isencoes.p1')}</p>
                <p>{t('terms.sections.isencoes.p2')}</p>
            </LegalSection>

            <LegalSection id="mudancas" num={9} title={t('terms.sections.mudancas.title')} tldr={t('terms.sections.mudancas.tldr')}>
                <p>{t('terms.sections.mudancas.p1')}</p>
                <p>{t('terms.sections.mudancas.p2')}</p>
            </LegalSection>

            <LegalSection id="lei" num={10} title={t('terms.sections.lei.title')} tldr={t('terms.sections.lei.tldr')}>
                <p>{t('terms.sections.lei.p1')}</p>
                <p>{t('terms.sections.lei.p2')}</p>
            </LegalSection>

            {/* Footer card */}
            <Card variant="flat" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-mr-body font-mr-extrabold text-mr-fg">{t('terms.footerCard.title')}</p>
                    <p className="text-mr-small text-mr-fg-muted">{t('terms.footerCard.desc')}</p>
                </div>
                <Button variant="primary" icon={MessageCircle} onClick={() => navigate(ROUTES.LEGAL_CONTACT)}>
                    {t('terms.footerCard.cta')}
                </Button>
            </Card>

            <LegalCrossLinks current="terms" />
        </LegalShell>
    );
}
