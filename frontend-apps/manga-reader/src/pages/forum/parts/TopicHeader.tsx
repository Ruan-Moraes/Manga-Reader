import { useTranslation } from 'react-i18next';
import { ArrowLeft, Share2, Eye, MessageCircle } from 'lucide-react';
import { Badge } from '@ui/Badge';
import { Avatar } from '@ui/Avatar';
import type { TopicData } from './forumTopicMock';

type Props = {
    topic: TopicData;
    onBack: () => void;
};

const TopicHeader = ({ topic, onBack }: Props) => {
    const { t } = useTranslation('forum');

    return (
        <>
            <nav className="mb-4 flex items-center gap-1 text-mr-tiny text-mr-fg-muted">
                <button type="button" onClick={onBack} className="hover:text-mr-accent transition-colors">
                    {t('page.title')}
                </button>
                <span>/</span>
                <span className="text-mr-fg-subtle">{topic.category}</span>
                <span>/</span>
                <span className="line-clamp-1 text-mr-fg">{topic.title}</span>
            </nav>

            <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-1 text-mr-tiny text-mr-fg-muted hover:text-mr-accent transition-colors"
            >
                <ArrowLeft className="size-3.5" /> {t('topic.backToForum')}
            </button>

            <div className="mb-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{topic.category}</Badge>
                    {topic.pinned && (
                        <Badge>
                            <span className="text-mr-tiny">{t('topicPage.pinned')}</span>
                        </Badge>
                    )}
                </div>
                <h1 className="mb-4 text-mr-h2 font-mr-extrabold tracking-mr text-mr-fg leading-tight">{topic.title}</h1>
                <div className="flex items-center gap-3 text-mr-tiny text-mr-fg-subtle">
                    <Avatar name={topic.author.name} size={32} />
                    <div>
                        <span className="font-mr-bold text-mr-fg">{topic.author.name}</span>
                        <span className="ml-1">{topic.author.handle}</span>
                        <span className="mx-2">·</span>
                        <span>{topic.postedAt}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <span className="inline-flex items-center gap-1">
                            <Eye className="size-3" />
                            {topic.views.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <MessageCircle className="size-3" />
                            {topic.replies}
                        </span>
                        <button type="button" className="inline-flex items-center gap-1 hover:text-mr-accent transition-colors">
                            <Share2 className="size-3" /> {t('topicPage.share')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TopicHeader;
