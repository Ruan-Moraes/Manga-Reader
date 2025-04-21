import { AiFillLike } from 'react-icons/ai';
import { AiFillDislike } from 'react-icons/ai';
import { FaCalendarDays } from 'react-icons/fa6';
import IconButton from '../buttons/IconButton';

type FilterCommentsProps = {
  // Define the props for FilterComments component here
};

const FilterComments = () => {
  return (
    <div className="flex flex-col gap-1 p-2 border rounded-xs bg-secondary border-tertiary">
      <div>
        <h4 className="font-bold">Filtar comentários por:</h4>
      </div>
      <div className="flex items-center gap-2">
        <IconButton onClick={() => {}} className="flex items-center gap-2 py-2">
          <AiFillLike size={16} />
          <span className="text-xs font-bold">mais curtidas</span>
        </IconButton>
        <IconButton onClick={() => {}} className="flex items-center gap-2 py-2">
          <AiFillDislike size={13} />
          <span className="text-xs font-bold">mais dislikes</span>
        </IconButton>
        <IconButton onClick={() => {}} className="flex items-center gap-2 py-2">
          <FaCalendarDays size={13} />
        </IconButton>
      </div>
    </div>
  );
};

export default FilterComments;
