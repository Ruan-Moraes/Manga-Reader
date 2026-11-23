import Icon from '@/shared/component/Icon';
import { CATALOG } from '@/shared/data/catalog';
import { MiniPoster, useLandingText } from './shared';

export function ProfileScreen() {
    const { ui, mock } = useLandingText();
    const tabs = ui.tabsLib;
    const grid = CATALOG.slice(0, 10);
    const stats: [string, string][] = [
        ['142', mock.statReading],
        ['89', mock.statCompleted],
        ['4.8', mock.statAvg],
    ];

    return (
        <div className="@container flex h-full flex-col gap-4 overflow-hidden p-[18px]">
            <div className="flex items-center gap-3.5">
                <div className="flex size-14 items-center justify-center rounded-sm bg-accent text-[22px] font-extrabold text-on-accent">
                    RM
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-base font-extrabold tracking-[.0625rem] text-fg">
                        {mock.profileName}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-accent-muted bg-accent-subtle px-[9px] py-0.5 text-[11px] font-bold text-accent-fg">
                        <Icon name="sync" size={12} /> {ui.synced}
                    </div>
                </div>
            </div>
            <div className="flex gap-2.5">
                {stats.map(([v, l]) => (
                    <div
                        key={l}
                        className="flex-1 rounded border border-line-soft bg-primary p-[10px_12px]"
                    >
                        <div className="text-lg font-extrabold text-accent-fg">
                            {v}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[.06em] text-copy-muted">
                            {l}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 overflow-hidden">
                {tabs.map((tb, i) => (
                    <span
                        key={tb}
                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold ${i === 0 ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-elevated text-copy'}`}
                    >
                        {tb}
                    </span>
                ))}
            </div>
            <div className="min-h-0 flex-1">
                <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-3 @max-[380px]:grid-cols-3 @max-[380px]:gap-2.5">
                    {grid.map(m => (
                        <MiniPoster key={m.id} m={m} w="100%" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProfileScreen;
