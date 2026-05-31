import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { MangaCard } from '@ui/MangaCard';
import { Badge } from '@ui/Badge';

export type TrendingManga = {
    id: string;
    title: string;
    author?: string;
    cover?: string;
    rating?: number;
    chapter?: number;
    readers: number;
    delta: number;
};

export const MANGA_LIST: TrendingManga[] = [
    {
        id: '1',
        title: 'Berserk',
        author: 'K. Miura',
        rating: 4.9,
        chapter: 370,
        readers: 48200,
        delta: +12,
    },
    {
        id: '2',
        title: 'One Piece',
        author: 'E. Oda',
        rating: 4.8,
        chapter: 1110,
        readers: 92400,
        delta: +5,
    },
    {
        id: '3',
        title: 'Jujutsu Kaisen',
        author: 'G. Akutami',
        rating: 4.7,
        chapter: 260,
        readers: 74100,
        delta: +28,
    },
    {
        id: '4',
        title: 'Chainsaw Man',
        author: 'T. Fujimoto',
        rating: 4.7,
        chapter: 168,
        readers: 61300,
        delta: -3,
    },
    {
        id: '5',
        title: 'Blue Lock',
        author: 'M. Kaneshiro',
        rating: 4.5,
        chapter: 265,
        readers: 55800,
        delta: +18,
    },
    {
        id: '6',
        title: 'Frieren',
        author: 'K. Yamada',
        rating: 4.9,
        chapter: 120,
        readers: 52400,
        delta: +7,
    },
    {
        id: '7',
        title: 'Vinland Saga',
        author: 'M. Yukimura',
        rating: 4.8,
        chapter: 210,
        readers: 43900,
        delta: +2,
    },
    {
        id: '8',
        title: 'Vagabond',
        author: 'T. Inoue',
        rating: 4.9,
        chapter: 327,
        readers: 38700,
        delta: -8,
    },
    {
        id: '9',
        title: 'Spy x Family',
        author: 'T. Endo',
        rating: 4.6,
        chapter: 105,
        readers: 35200,
        delta: +11,
    },
    {
        id: '10',
        title: 'Dungeon Meshi',
        author: 'R. Kui',
        rating: 4.8,
        chapter: 97,
        readers: 31600,
        delta: +4,
    },
    {
        id: '11',
        title: 'Fullmetal Alch.',
        author: 'H. Arakawa',
        rating: 4.9,
        chapter: 108,
        readers: 28400,
        delta: -1,
    },
    {
        id: '12',
        title: 'Attack on Titan',
        author: 'H. Isayama',
        rating: 4.9,
        chapter: 139,
        readers: 25100,
        delta: -5,
    },
];

const DeltaBadge = ({ delta }: { delta: number }) => {
    if (delta === 0) return null;
    const up = delta > 0;
    return (
        <span
            aria-label={`${up ? 'Subiu' : 'Caiu'} ${Math.abs(delta)}%`}
            className={`inline-flex items-center gap-0.5 text-mr-tiny font-mr-bold ${up ? 'text-mr-accent' : 'text-mr-danger'}`}
        >
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(delta)}%
        </span>
    );
};

export const RankedRow = ({ rank, manga, onNavigate }: { rank: number; manga: TrendingManga; onNavigate: () => void }) => (
    <li>
        <button
            type="button"
            onClick={onNavigate}
            className="flex w-full items-center gap-3 rounded-mr-md border border-mr-border bg-mr-surface p-3 text-left transition-colors hover:border-mr-accent"
        >
            <span className="shrink-0 font-mono text-[2rem] font-black leading-none text-mr-accent" aria-label={`${rank}º lugar`}>
                {rank}
            </span>
            <div className="size-12 shrink-0 rounded-mr-xs bg-mr-tertiary/20" />
            <div className="flex-1 min-w-0">
                <p className="truncate text-mr-small font-mr-bold text-mr-fg">{manga.title}</p>
                <p className="text-mr-tiny text-mr-fg-muted">{manga.author}</p>
                <p className="text-mr-tiny text-mr-fg-subtle">{manga.readers.toLocaleString()} leitores</p>
            </div>
            <DeltaBadge delta={manga.delta} />
        </button>
    </li>
);

type TrendingSectionProps = { mangas: TrendingManga[] };

const TrendingSection = ({ mangas }: TrendingSectionProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('home');
    const top3 = mangas.slice(0, 3);
    const rest = mangas.slice(3);
    const podiumOrder = [top3[1], top3[0], top3[2]];

    return (
        <>
            <ol aria-label={t('trending.top3Aria')} className="hidden md:grid md:grid-cols-3 mb-10 gap-4 items-end">
                {podiumOrder.map((manga, idx) => {
                    const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                    const isFirst = rank === 1;
                    return (
                        <li key={manga.id} className={`flex flex-col items-center gap-2 ${isFirst ? 'order-2' : idx === 0 ? 'order-1' : 'order-3'}`}>
                            <Badge variant={isFirst ? 'accent' : 'neutral'}>{rank === 1 ? 'Top 1' : rank === 2 ? '2º lugar' : '3º lugar'}</Badge>
                            <MangaCard manga={manga} size={isFirst ? 'lg' : 'md'} featured={isFirst} onClick={() => navigate(ROUTES.TITLE_DETAIL(manga.id))} />
                        </li>
                    );
                })}
            </ol>

            <div>
                <p className="mr-label mb-3 text-mr-fg-subtle">{top3.length > 0 ? 'Top 3' : ''}</p>
                <ol className="mb-6 flex flex-col gap-2 md:hidden" aria-label={t('trending.top3Aria')}>
                    {top3.map((manga, i) => (
                        <RankedRow key={manga.id} rank={i + 1} manga={manga} onNavigate={() => navigate(ROUTES.TITLE_DETAIL(manga.id))} />
                    ))}
                </ol>
                <p className="mr-label mb-3 text-mr-fg-subtle">{t('trending.others')}</p>
                <ol className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3" aria-label={t('trending.fullRankingAria')} start={4}>
                    {rest.map((manga, i) => (
                        <RankedRow key={manga.id} rank={i + 4} manga={manga} onNavigate={() => navigate(ROUTES.TITLE_DETAIL(manga.id))} />
                    ))}
                </ol>
            </div>
        </>
    );
};

export default TrendingSection;
