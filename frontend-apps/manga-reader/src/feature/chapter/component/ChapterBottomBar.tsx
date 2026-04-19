import { forwardRef } from 'react';
import { MultiValue, SingleValue } from 'react-select';

import { type SelectOption } from '@shared/component/ui/StyledSelect';

import ChapterNavigation from './ChapterNavigation';

type ChapterBottomBarProps = {
    chapterId: string;
    onChapterChange: (
        newValue: MultiValue<SelectOption> | SingleValue<SelectOption>,
    ) => void;
};

const ChapterBottomBar = forwardRef<HTMLDivElement, ChapterBottomBarProps>(
    ({ chapterId, onChapterChange }, ref) => {
        return (
            <div
                className="fixed bottom-[calc(0%_-_0.5rem)] shadow-black left-0 right-0 flex justify-center gap-2 p-2 m-4 mb-2 transition-all transform border duration-300 bg-secondary border-tertiary rounded-xs"
                ref={ref}
            >
                <div className="grow">
                    <ChapterNavigation
                        chapterId={chapterId}
                        onChapterChange={onChapterChange}
                        variant="chapter"
                        menuPlacement="top"
                    />
                </div>
            </div>
        );
    },
);

ChapterBottomBar.displayName = 'ChapterBottomBar';

export default ChapterBottomBar;
