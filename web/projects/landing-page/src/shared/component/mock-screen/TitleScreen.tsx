import Icon from '@/shared/component/Icon';
import RatingStars from '@/shared/component/RatingStars';
import { CATALOG } from '@/shared/data/catalog';
import { MiniPoster, ScreenHeader, useLandingText } from './shared';

export function TitleScreen() {
    const { ui, mock } = useLandingText();
    const m = CATALOG[1];
    const genres = [m.genre, 'Aventura', 'Drama'];
    const chapters = [140, 139, 138, 137, 136];
    const chaptersLabel =
        ui.chapters.charAt(0).toUpperCase() + ui.chapters.slice(1);

    return (
        <div className="flex h-full flex-col gap-4 overflow-hidden p-[18px]">
            <div className="flex gap-4">
                <MiniPoster m={m} w={120} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h3 className="m-0 text-xl font-extrabold tracking-[.0625rem] text-fg">
                        {m.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[13px] font-bold text-accent-fg">
                        <RatingStars value={5} size={13} /> {m.rating}
                        <span className="font-semibold text-tertiary">
                            · {m.ch} {ui.chapters}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {genres.map(g => (
                            <span
                                key={g}
                                className="rounded-full border border-line bg-surface-elevated px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[.06em] text-copy"
                            >
                                {g}
                            </span>
                        ))}
                    </div>
                    <p className="line-clamp-3 m-0 overflow-hidden text-xs leading-[1.55] text-copy-muted">
                        {mock.synopsis}
                    </p>
                    <div className="mt-0.5 flex gap-2">
                        <span className="inline-flex h-[34px] items-center gap-1.5 rounded-sm bg-accent px-4 text-xs font-extrabold tracking-[.0625rem] text-on-accent">
                            <Icon name="play" size={13} /> {ui.readNow}
                        </span>
                        <span className="inline-flex size-[34px] items-center justify-center rounded-sm border border-line bg-transparent text-accent-fg">
                            <Icon name="bookmark" size={15} />
                        </span>
                    </div>
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <ScreenHeader>{chaptersLabel}</ScreenHeader>
                <div className="flex flex-col gap-[7px]">
                    {chapters.map((c, i) => (
                        <div
                            key={c}
                            className={`flex items-center justify-between rounded p-[9px_12px] ${i === 0 ? 'border border-accent-muted bg-accent-5' : 'border border-line-soft bg-primary'}`}
                        >
                            <span
                                className={`text-xs ${i === 0 ? 'font-bold text-accent-fg' : 'font-semibold text-fg'}`}
                            >
                                {ui.chapter} {c}
                            </span>
                            <span className="text-[10px] text-tertiary">
                                {mock.ago[i]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TitleScreen;
