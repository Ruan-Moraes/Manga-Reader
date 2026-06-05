import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, MessageCircle, Share2 } from 'lucide-react';

import { RoleChip } from '@ui/RoleChip';
import type { TopicData } from '@entities/forum';

type Props = {
    topic: TopicData;
    onBack: () => void;
};

const TopicHeader = ({ topic, onBack }: Props) => {
    const { t } = useTranslation('forum');

    return (
        <>
            <nav className="mb-3.5 flex items-center text-mr-small text-mr-fg-subtle">
                <button type="button" onClick={onBack} className="transition-colors hover:text-mr-accent">
                    {t('page.title')}
                </button>
                <span className="mx-1.5 text-mr-tertiary">/</span>
                <span>{topic.category}</span>
                <span className="mx-1.5 text-mr-tertiary">/</span>
                <span className="line-clamp-1 text-mr-fg-muted">{topic.title}</span>
            </nav>

            <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-1 text-mr-small text-mr-fg-subtle transition-colors hover:text-mr-accent"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" /> {t('topic.backToForum')}
            </button>

            <div className="mb-5 flex flex-wrap items-center gap-2">
                <RoleChip role="OP" label={topic.category} />
                {topic.pinned && <RoleChip role="FIXADO" label={t('topicPage.pinned')} />}
            </div>

            <h1 className="mb-3 text-[26px] font-mr-extrabold leading-tight tracking-mr text-mr-fg">{topic.title}</h1>

            <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-mr-small font-mr-semibold text-mr-fg-subtle">
                <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {topic.views.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="size-3.5" aria-hidden="true" />
                    {topic.replies}
                </span>
                <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-mr-accent">
                    <Share2 className="size-3.5" aria-hidden="true" /> {t('topicPage.share')}
                </button>
            </div>
        </>
    );
};

export default TopicHeader;
