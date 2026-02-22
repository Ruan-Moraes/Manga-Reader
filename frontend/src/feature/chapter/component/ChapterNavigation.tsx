import { MultiValue, SingleValue } from 'react-select';

import StyledSelect, {
    type SelectOption,
} from '@shared/component/ui/StyledSelect';

import { CHAPTER_OPTIONS } from '../constant/chapterOptions';

type ChapterNavigationProps = {
    chapterId: string;
    onChapterChange: (
        newValue: MultiValue<SelectOption> | SingleValue<SelectOption>,
    ) => void;
    variant?: 'default' | 'chapter';
    menuPlacement?: 'auto' | 'bottom' | 'top';
};

const ChapterNavigation = ({
    chapterId,
    onChapterChange,
    variant = 'default',
    menuPlacement,
}: ChapterNavigationProps) => {
    return (
        <div className="flex flex-col gap-2">
            <div>
                <form>
                    <StyledSelect
                        variant={variant}
                        name="chapter"
                        onChange={onChapterChange}
                        defaultValue={{
                            value: chapterId,
                            label: `Capítulo ${chapterId}`,
                        }}
                        isClearable={false}
                        isSearchable={false}
                        noOptionsMessage={() => 'Carregando...'}
                        options={CHAPTER_OPTIONS}
                        {...(menuPlacement && { menuPlacement })}
                    />
                </form>
            </div>
            <div className="flex gap-2">
                <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">
                    Anterior
                </button>
                <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">
                    Próximo
                </button>
            </div>
        </div>
    );
};

export default ChapterNavigation;
