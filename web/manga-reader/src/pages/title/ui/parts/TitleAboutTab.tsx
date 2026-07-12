import { useTranslation } from 'react-i18next';
import { Badge } from '@ui/Badge';
import type { AuthorRole, Title } from '@entities/manga';

type AboutTabProps = {
    title: Title;
};

const CREDIT_ROLE_ORDER: AuthorRole[] = ['AUTHOR', 'ARTIST', 'STORY', 'COLORIST', 'LETTERER', 'EDITOR'];

const TitleAboutTab = ({ title }: AboutTabProps) => {
    const { t } = useTranslation('manga');

    const creditRows = CREDIT_ROLE_ORDER.map(role => ({
        role,
        names: title.authors.filter(a => a.role === role).map(a => a.name),
    })).filter(row => row.names.length > 0);

    const publisherNames = title.publishers.map(p => p.name);

    const hasCredits = creditRows.length > 0 || publisherNames.length > 0;

    return (
        <div className="max-w-[640px] flex flex-col gap-6">
            <section>
                <h2 className="mb-2 text-mr-small font-mr-bold text-mr-fg">{t('titleDetails.fullSynopsis')}</h2>
                <p className="text-mr-small leading-relaxed text-mr-fg-muted">{title.synopsis}</p>
            </section>
            <section>
                <h2 className="mb-2 text-mr-small font-mr-bold text-mr-fg">{t('genres')}</h2>
                <div className="flex flex-wrap gap-2">
                    {title.genres.map(g => (
                        <Badge key={g} variant="neutral">
                            {g}
                        </Badge>
                    ))}
                </div>
            </section>
            {hasCredits && (
                <section>
                    <h2 className="mb-2 text-mr-small font-mr-bold text-mr-fg">{t('titleDetails.credits')}</h2>
                    <dl className="flex flex-col gap-1.5 text-mr-small">
                        {creditRows.map(({ role, names }) => (
                            <div key={role} className="flex flex-wrap gap-1.5">
                                <dt className="font-mr-semibold text-mr-fg-subtle">{t(`details.role.${role}`)}:</dt>
                                <dd className="text-mr-fg-muted">{names.join(', ')}</dd>
                            </div>
                        ))}
                        {publisherNames.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                <dt className="font-mr-semibold text-mr-fg-subtle">{t('details.publisher')}</dt>
                                <dd className="text-mr-fg-muted">{publisherNames.join(', ')}</dd>
                            </div>
                        )}
                    </dl>
                </section>
            )}
        </div>
    );
};

export default TitleAboutTab;
