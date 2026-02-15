import BaseModal from '../../base/BaseModal';
import InfoModalHeader from './header/InfoModalHeader';
import InfoModalBody from './body/InfoModalBody';
import InfoModalFooter from './footer/InfoModalFooter';

type InfoModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    title: string;
    message: string;
    linkText: string;
    linkUrl: string;
};

const InfoModal = ({
    isModalOpen,
    closeModal,
    title,
    message,
    linkText,
    linkUrl,
}: InfoModalProps) => {
    const handleLinkClick = () => {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
        closeModal();
    };

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <InfoModalHeader title={title} />
            <InfoModalBody message={message} />
            <InfoModalFooter
                onLinkClick={handleLinkClick}
                onClose={closeModal}
                linkText={linkText}
            />
        </BaseModal>
    );
};

export default InfoModal;
