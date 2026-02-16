import BadgeIconButton from '@shared/component/button/BadgeIconButton';

import CalendarArrowDownIcon from '@/asset/svg/calendar-arrow-down.svg';

type SortOldestButtonProps = {
    onClick: () => void;
    className?: string;
};

const SortOldestButton = ({ onClick, className }: SortOldestButtonProps) => {
    return (
        <BadgeIconButton onClick={onClick} className={className}>
            <img
                src={CalendarArrowDownIcon}
                alt="Calendar Arrow Down"
                className="w-[0.9296875rem] h-[0.9296875rem]"
            />
        </BadgeIconButton>
    );
};

export default SortOldestButton;
