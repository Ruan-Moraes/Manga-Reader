import useAppNavigate from '@shared/hook/useAppNavigate';
import { FileText, Shield, Copyright, Mail, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@ui/Card';

type LegalPage = 'terms' | 'privacy' | 'dmca' | 'contact';

const PAGE_META: Record<LegalPage, { icon: typeof FileText; path: string }> = {
    terms: { icon: FileText, path: '/legal/terms' },
    privacy: { icon: Shield, path: '/legal/privacy' },
    dmca: { icon: Copyright, path: '/legal/dmca' },
    contact: { icon: Mail, path: '/legal/contact' },
};

export const LegalCrossLinks = ({ current }: { current: LegalPage }) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('legal');
    const others = (Object.keys(PAGE_META) as LegalPage[]).filter(k => k !== current);

    return (
        <nav aria-label={t('crossLinks.ariaLabel')} className="mt-12 border-t border-ui-border-subtle pt-8">
            <p className="ui-label mb-4 text-ui-fg-subtle">{t('crossLinks.heading')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {others.map(key => {
                    const meta = PAGE_META[key];
                    const Icon = meta.icon;

                    return (
                        <Card key={key} variant="default" interactive onClick={() => navigate(meta.path)} className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-ui-xs bg-ui-accent-25 text-ui-accent-fg">
                                <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-ui-small font-ui-extrabold text-ui-fg truncate">{t(`crossLinks.pages.${key}.label`)}</div>
                                <div className="text-ui-tiny text-ui-fg-subtle truncate">{t(`crossLinks.pages.${key}.desc`)}</div>
                            </div>
                            <ArrowRight className="size-4 shrink-0 text-ui-fg-subtle" />
                        </Card>
                    );
                })}
            </div>
        </nav>
    );
};

export default LegalCrossLinks;
