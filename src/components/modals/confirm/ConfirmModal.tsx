import { useCallback } from 'react';

import BaseModal from '../base/BaseModal';
import BaseButton from '../../buttons/BaseButton';

type ConfirmModalProps = {
  isOpen: boolean;

  onConfirm: () => void;
  onCancel: () => void;

  title: string;
  message: string;
};

const ConfirmModal = ({
  isOpen,

  onConfirm,
  onCancel,

  title,
  message,
}: ConfirmModalProps) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancelClick = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    isOpen && (
      <BaseModal isModalOpen={isOpen} closeModal={handleCancelClick}>
        <div className="flex flex-col gap-4 p-2">
          <h2 className="text-lg font-bold leading-none text-center text-quinary-default">
            {title}
          </h2>
          <p className="text-sm font-normal text-center">{message}</p>
          <div className="flex justify-end gap-2">
            <BaseButton text="Cancelar" onClick={handleCancelClick} />
            <BaseButton text="Confirmar" onClick={handleConfirm} />
          </div>
        </div>
      </BaseModal>
    )
  );
};

export default ConfirmModal;
