import { useCallback } from 'react';

import { useConfirmModalContext } from '../../../context/modals/confirm/useModalContext';

import BaseModal from '../base/BaseModal';
import BaseButton from '../../buttons/BaseButton';

type ConfirmModalProps = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const { isConfirmModalOpen, closeConfirmModal } = useConfirmModalContext();

  const handleConfirm = useCallback(() => {
    onConfirm();

    closeConfirmModal();
  }, [onConfirm, closeConfirmModal]);

  const handleCancel = useCallback(() => {
    onCancel();

    closeConfirmModal();
  }, [onCancel, closeConfirmModal]);

  return (
    isConfirmModalOpen && (
      <>
        <BaseModal
          isModalOpen={isConfirmModalOpen}
          closeModal={closeConfirmModal}
        >
          <div className="flex flex-col gap-4 p-2">
            <h2 className="text-lg font-bold leading-none text-center text-quinary-default">
              {title}
            </h2>
            <p className="text-sm font-normal text-center">{message}</p>
            <div className="flex justify-end gap-2">
              <BaseButton text="Cancelar" onClick={handleCancel} />
              <BaseButton text="Confirmar" onClick={handleConfirm} />
            </div>
          </div>
        </BaseModal>
      </>
    )
  );
};

export default ConfirmModal;
