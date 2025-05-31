import IconButton from '../buttons/IconButton';

import CalendarArrowUpIcon from '../../assets/svg/calendar-arrow-up.svg';

type CalendarArrowUpProps = {
    onClick: () => void;
    className?: string;
};

const CalendarArrowUp = ({onClick, className}: CalendarArrowUpProps) => {
    return (
        <IconButton onClick={onClick} className={className}>
            <img
                src={CalendarArrowUpIcon}
                alt="Calendar Arrow Up"
                className="w-[0.9296875rem] h-[0.9296875rem]"
            />
        </IconButton>
    );
};

export default CalendarArrowUp;
