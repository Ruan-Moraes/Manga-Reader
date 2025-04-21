import IconButton from '../buttons/IconButton';

import CalendarArrowDownIcon from '../../assets/svg/calendar-arrow-down.svg';

type CalendarArrowDownProps = {
  onClick: () => void;
  className?: string;
};

const CalendarArrowDown = ({ onClick, className }: CalendarArrowDownProps) => {
  return (
    <IconButton onClick={onClick} className={className}>
      <img
        src={CalendarArrowDownIcon}
        alt="Calendar Arrow Down"
        className="w-[0.9296875rem] h-[0.9296875rem]"
      />
    </IconButton>
  );
};

export default CalendarArrowDown;
