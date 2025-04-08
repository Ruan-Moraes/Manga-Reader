import { AiFillLike } from 'react-icons/ai';
import { AiFillDislike } from 'react-icons/ai';
import { FaRegTrashAlt } from 'react-icons/fa';

type CommentActionsProps = {
  isOwner: boolean | undefined;
};

const CommentActions = ({ isOwner }: CommentActionsProps) => {
  return (
    <div className="flex justify-between">
      <div className="flex gap-2">
        <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
          <AiFillDislike />
        </button>
        <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
          <AiFillLike />
        </button>
      </div>
      <div className="flex gap-2">
        {isOwner && (
          <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
            <FaRegTrashAlt />
          </button>
        )}
        <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
          Responder
        </button>
      </div>
    </div>
  );
};

export default CommentActions;
