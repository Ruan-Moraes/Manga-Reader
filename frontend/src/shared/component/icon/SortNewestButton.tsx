import BadgeIconButton from '@shared/component/button/BadgeIconButton';

import CalendarArrowUpIcon from '@/asset/svg/calendar-arrow-up.svg';

type SortNewestButtonProps = {
    onClick: () => void;
    className?: string;
};

const SortNewestButton = ({ onClick, className }: SortNewestButtonProps) => {
    return (
        <BadgeIconButton onClick={onClick} className={className}>
            <img
                src={CalendarArrowUpIcon}
                alt="Calendar Arrow Up"
                className="w-[0.9296875rem] h-[0.9296875rem]"
            />
        </BadgeIconButton>
    );
};

export default SortNewestButton;
