import { useCallback } from 'react';
import { AiFillLike } from 'react-icons/ai';
import { AiFillDislike } from 'react-icons/ai';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

import { useConfirmModalContext } from '../../../context/modals/confirm/useModalContext';

import ConfirmModal from '../../modals/confirm/ConfirmModal';
import IconButton from '../../buttons/IconButton';
import BlackButton from '../../buttons/BlackButton';

type CommentActionsProps = {
  isOwner: boolean | undefined;
  likeCount?: number;
  dislikeCount?: number;
};

const CommentActions = ({ isOwner }: CommentActionsProps) => {
  const { openConfirmModal } = useConfirmModalContext();

  // TODO: Implementar a lógica de deletar comentário
  // Provavelmente, passar o ID do comentário para o modal, deletar o comentário
  // e deletar recursivamente quaisquer comentários relacionados que o referenciem.

  const handleDelete = useCallback(() => {
    // TODO: Implementar lógica de deletar comentário
    console.log('Comment deleted');
  }, []);

  const handleCancel = useCallback(() => {
    // TODO: Implementar lógica de cancelar a exclusão do comentário
    console.log('Delete canceled');
  }, []);

  return (
    <div className="flex justify-between">
      <ConfirmModal
        title="Deletar comentário"
        message="Você tem certeza que deseja deletar este comentário? Essa ação NÃO deletará os comentários relacionados a ele."
        onConfirm={handleDelete}
        onCancel={handleCancel}
      />
      <div className="flex gap-2">
        <IconButton onClick={() => {}} dislikeCount="12">
          <AiFillDislike size={13} />
        </IconButton>
        <IconButton onClick={() => {}} likeCount="52">
          <AiFillLike size={13} />
        </IconButton>
      </div>
      <div className="flex gap-2">
        {isOwner && (
          <>
            <IconButton
              onClick={() => {
                openConfirmModal();
              }}
            >
              <FaRegTrashAlt size={13} />
            </IconButton>
            <IconButton
              onClick={() => {
                openConfirmModal();
              }}
            >
              <MdEdit size={13} />
            </IconButton>
          </>
        )}
        {/* TODO: Implementar lógica de resposta */}
        <BlackButton text="Responder" onClick={() => {}} />
      </div>
    </div>
  );
};

export default CommentActions;
