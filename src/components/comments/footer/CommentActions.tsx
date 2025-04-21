import { useCallback } from 'react';
import { AiFillLike } from 'react-icons/ai';
import { AiFillDislike } from 'react-icons/ai';
import { FaRegTrashAlt } from 'react-icons/fa';

import { useConfirmModalContext } from '../../../context/modals/confirm/useModalContext';

import ConfirmModal from '../../modals/confirm/ConfirmModal';
import IconButton from '../../buttons/IconButton';

type CommentActionsProps = {
  isOwner: boolean | undefined;
};

const CommentActions = ({ isOwner }: CommentActionsProps) => {
  const { openConfirmModal } = useConfirmModalContext();

  // TODO: Implement the logic to delete the comment
  // Likely, you'll need to pass the comment ID to the modal, delete the comment,
  // and recursively delete any related comments that reference it.

  const handleDelete = useCallback(() => {
    // Implement delete logic here
    console.log('Comment deleted');
  }, []);

  const handleCancel = useCallback(() => {
    // Implement cancel logic here
    console.log('Delete canceled');
  }, []);

  return (
    <div className="flex justify-between">
      <ConfirmModal
        title="Deletar comentário"
        message="Você tem certeza que deseja deletar este comentário? Essa ação deletará os comentários relacionados a ele."
        onConfirm={handleDelete}
        onCancel={handleCancel}
      />
      <div className="flex gap-2">
        <IconButton onClick={() => {}}>
          <AiFillDislike size={13} />
        </IconButton>
        <IconButton onClick={() => {}}>
          <AiFillLike size={13} />
        </IconButton>
      </div>
      <div className="flex gap-2">
        {isOwner && (
          <IconButton
            onClick={() => {
              openConfirmModal();
            }}
          >
            <FaRegTrashAlt size={13} />
          </IconButton>
        )}
        <button className="px-3 py-2 text-xs shadow-lg rounded-xs bg-primary-default">
          Responder
        </button>
      </div>
    </div>
  );
};

export default CommentActions;
