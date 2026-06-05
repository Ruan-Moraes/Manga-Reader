import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { MangaPoster } from '@ui/MangaPoster';
import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { EmptyState } from '@ui/EmptyState';

export type ReleaseItem = {
    id: string;
    mangaId: string;
    title: string;
    chapter: number;
    time: string;
    group: string;
    lang: string;
    isNew: boolean;
    cover?: string;
};

export type ReleaseGroup = {
    label: string;
    date: string;
    items: ReleaseItem[];
};

export const RELEASE_GROUPS: ReleaseGroup[] = [
    {
        label: 'Hoje',
        date: '23 mai 2026',
        items: [
            {
                id: 'r1',
                mangaId: '1',
                title: 'Berserk',
                chapter: 370,
                time: '14:32',
                group: 'Scan Brasileiro',
                lang: 'PT-BR',
                isNew: true,
            },
            {
                id: 'r2',
                mangaId: '2',
                title: 'One Piece',
                chapter: 1110,
                time: '12:00',
                group: 'HQ Brasil',
                lang: 'PT-BR',
                isNew: true,
            },
            {
                id: 'r3',
                mangaId: '6',
                title: 'Chainsaw Man',
                chapter: 168,
                time: '10:45',
                group: 'Wonder Scans',
                lang: 'PT-BR',
                isNew: false,
            },
            {
                id: 'r4',
                mangaId: '12',
                title: 'Frieren',
                chapter: 120,
                time: '09:20',
                group: 'Scan Brasileiro',
                lang: 'PT-BR',
                isNew: false,
            },
        ],
    },
    {
        label: 'Ontem',
        date: '22 mai 2026',
        items: [
            {
                id: 'r5',
                mangaId: '3',
                title: 'Jujutsu Kaisen',
                chapter: 261,
                time: '22:15',
                group: 'HQ Brasil',
                lang: 'PT-BR',
                isNew: false,
            },
            {
                id: 'r6',
                mangaId: '8',
                title: 'Blue Lock',
                chapter: 265,
                time: '18:00',
                group: 'Wonder Scans',
                lang: 'PT-BR',
                isNew: false,
            },
            {
                id: 'r7',
                mangaId: '10',
                title: 'Spy x Family',
                chapter: 105,
                time: '16:30',
                group: 'Scan Brasileiro',
                lang: 'PT-BR',
                isNew: false,
            },
            {
                id: 'r8',
                mangaId: '11',
                title: 'Vinland Saga',
                chapter: 211,
                time: '14:00',
                group: 'Wonder Scans',
                lang: 'PT-BR',
                isNew: false,
            },
        ],
    },
    {
        label: 'Há 2 dias',
        date: '21 mai 2026',
        items: [
            {
                id: 'r9',
                mangaId: '4',
                title: 'Vagabond',
                chapter: 327,
                time: '20:10',
                group: 'Scan Brasileiro',
                lang: 'PT-BR',
                isNew: false,
            },
            {
                id: 'r10',
                mangaId: '9',
                title: 'Dungeon Meshi',
                chapter: 97,
                time: '11:00',
                group: 'HQ Brasil',
                lang: 'PT-BR',
                isNew: false,
            },
            {
                id: 'r11',
                mangaId: '7',
                title: 'Attack on Titan',
                chapter: 139,
                time: '09:45',
                group: 'Wonder Scans',
                lang: 'PT-BR',
                isNew: false,
            },
        ],
    },
];

type ReleasesGridProps = { groups: ReleaseGroup[]; libraryOnly: boolean };

const ReleasesGrid = ({ groups, libraryOnly }: ReleasesGridProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');

    if (groups.length === 0) {
        return libraryOnly ? (
            <EmptyState illustration="pensando" title={t('releases.emptyLibrary.title')} description={t('releases.emptyLibrary.description')} />
        ) : (
            <EmptyState illustration="surpresa" title={t('releases.emptyFilter.title')} description={t('releases.emptyFilter.description')} />
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {groups.map(group => (
                <section key={group.date}>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-mr-tiny font-mr-bold uppercase tracking-wider text-mr-fg-subtle">
                            {group.label} ·{' '}
                            {t('releases.chaptersCount', {
                                count: group.items.length,
                            })}
                        </h2>
                        <button type="button" className="text-mr-tiny text-mr-fg-muted hover:text-mr-accent transition-colors">
                            {t('releases.markAllSeen')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {group.items.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => navigate(ROUTES.CHAPTER(item.mangaId, item.chapter))}
                                className="flex items-center gap-3 rounded-mr-md border border-mr-border bg-mr-surface p-3 text-left transition-colors hover:border-mr-accent"
                            >
                                <MangaPoster size={48} radius="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="truncate text-mr-small font-mr-bold text-mr-fg">{item.title}</span>
                                        {item.isNew && <Badge variant="accent">{t('releases.newBadge')}</Badge>}
                                    </div>
                                    <p className="text-mr-tiny text-mr-fg-muted">
                                        {t('reader.chapterAbbr')} {item.chapter}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1.5 text-mr-tiny text-mr-fg-subtle">
                                        <Avatar name={item.group} size={24} />
                                        <span>{item.group}</span>
                                        <span>·</span>
                                        <Badge variant="neutral">{item.lang}</Badge>
                                    </div>
                                </div>
                                <time
                                    dateTime={item.time}
                                    aria-label={t('releases.publishedAt', {
                                        time: item.time,
                                    })}
                                    className="shrink-0 text-mr-tiny text-mr-fg-subtle"
                                >
                                    {item.time}
                                </time>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default ReleasesGrid;
