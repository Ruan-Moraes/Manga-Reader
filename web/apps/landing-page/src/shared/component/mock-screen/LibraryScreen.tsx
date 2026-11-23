import { CATALOG } from '@/shared/data/catalog';
import { MiniPoster, MockSearch, ScreenHeader, useLandingText } from './shared';

export function LibraryScreen() {
    const { ui } = useLandingText();
    const cont = CATALOG.slice(0, 5);
    const grid = CATALOG.slice(2, 12);
    const progress = [72, 38, 90, 15, 55];

    return (
        <div className="@container flex h-full flex-col gap-[18px] overflow-hidden p-[18px]">
            <MockSearch ui={ui} />
            <div>
                <ScreenHeader action="→">{ui.continueReading}</ScreenHeader>
                <div className="flex gap-2.5 overflow-hidden">
                    {cont.map((m, i) => (
                        <MiniPoster
                            key={m.id}
                            m={m}
                            w={84}
                            showProgress
                            progress={progress[i]}
                        />
                    ))}
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <ScreenHeader action="→">{ui.forYou}</ScreenHeader>
                <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-3 @max-[380px]:grid-cols-3 @max-[380px]:gap-2.5">
                    {grid.map(m => (
                        <MiniPoster key={m.id} m={m} w="100%" tag={m.tag} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LibraryScreen;
