import { useTranslation } from 'react-i18next';
import { Badge } from '@ui/Badge';
import type { Title } from '@entities/manga';

type AboutTabProps = {
    title: Title;
};

const AboutTab = ({ title }: AboutTabProps) => {
    const { t } = useTranslation('manga');

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
        </div>
    );
};

export default AboutTab;
