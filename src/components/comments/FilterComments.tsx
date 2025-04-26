import { AiFillLike } from 'react-icons/ai';
import { AiFillDislike } from 'react-icons/ai';
// import { FaCalendarDays } from 'react-icons/fa6';

import IconButton from '../buttons/IconButton';
import CalendarArrowDown from '../icons/CalendarArrowDown';
import CalendarArrowUp from '../icons/CalendarArrowUp';

type FilterCommentsProps = {
  title: string;
};

// TODO: Fazer a lógica de filtro
const FilterComments = ({ title }: FilterCommentsProps) => {
  return (
    <div className="flex flex-col gap-1 p-2 border rounded-xs bg-secondary border-tertiary">
      <div>
        <h4 className="font-bold">{title}</h4>
      </div>
      <div className="flex items-center gap-2 grow">
        <IconButton onClick={() => {}} className="h-8">
          <AiFillDislike size={13} />
        </IconButton>
        <IconButton onClick={() => {}} className="h-8">
          <AiFillLike size={13} />
        </IconButton>
        <CalendarArrowDown onClick={() => {}} className="h-8" />
        <CalendarArrowUp onClick={() => {}} className="h-8" />
      </div>
    </div>
  );
};

export default FilterComments;
