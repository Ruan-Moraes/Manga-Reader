import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';

type SynopsisModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    synopsis: string;
};

const SynopsisModal = ({ isOpen, onClose, title, synopsis }: SynopsisModalProps) => {
    const { t } = useTranslation('manga');

    return (
        <Modal open={isOpen} onClose={onClose} title={t('synopsisModalTitle', { name: title })}>
            <p className="text-xs text-justify whitespace-pre-line leading-relaxed">{synopsis}</p>
        </Modal>
    );
};

export default SynopsisModal;
