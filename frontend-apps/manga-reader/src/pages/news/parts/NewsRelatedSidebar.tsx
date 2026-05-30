import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { formatRelativeDate } from '@feature/news';
import type { NewsItem } from '@feature/news';

type NewsRelatedSidebarProps = {
    related: NewsItem[];
};

const NewsRelatedSidebar = ({ related }: NewsRelatedSidebarProps) => {
    const { t } = useTranslation('news');

    return (
        <aside className="space-y-4">
            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h3 className="font-semibold">{t('details.relatedTitle')}</h3>
                <div className="flex gap-3 overflow-x-auto xl:block xl:space-y-2">
                    {related.map(item => (
                        <Link key={item.id} to={`${WEB_BASE_URL}/news/${item.id}`} className="block min-w-56 rounded-lg bg-primary p-2 xl:min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                            <p className="text-xs text-tertiary">
                                {t(`tabs.${item.category}`, {
                                    defaultValue: item.category,
                                })}{' '}
                                · {formatRelativeDate(item.publishedAt)}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h3 className="font-semibold">{t('details.readAlso')}</h3>
                {related.slice(0, 4).map(item => (
                    <Link key={`${item.id}-extra`} to={`${WEB_BASE_URL}/news/${item.id}`} className="block text-sm underline text-purple-300">
                        {item.title}
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default NewsRelatedSidebar;
