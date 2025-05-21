import { useCallback } from 'react';

import BaseModal from '../base/BaseModal';
import ConfirmModalHeader from './header/ConfirmModalHeader';
import ConfirmModalBody from './body/ConfirmModalBody';

type ConfirmModalProps = {
  isOpen: boolean;

  title: string;
  message: string;

  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmModal = ({
  isOpen,

  title,
  message,

  onConfirm,
  onCancel,
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
        <div className="flex flex-col gap-2 p-2">
          <ConfirmModalHeader title={title} />
          <ConfirmModalBody
            message={message}
            onConfirm={handleConfirm}
            onCancel={handleCancelClick}
          />
        </div>
      </BaseModal>
    )
  );
};

export default ConfirmModal;
