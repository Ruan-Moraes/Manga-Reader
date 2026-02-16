import Overlay from '@shared/component/blur/Overlay';

type BaseModalProps = {
    isModalOpen: boolean;

    closeModal: () => void;

    children: React.ReactNode;
};

const BaseModal = ({ isModalOpen, closeModal, children }: BaseModalProps) => {
    return (
        <>
            {isModalOpen && (
                <>
                    <Overlay isOpen={isModalOpen} onClickBlur={closeModal} />
                    <div className="fixed left-0 right-0 z-20 flex flex-col gap-2 mx-4 -translate-y-1/2 top-1/2">
                        <div className="z-20 flex flex-col gap-2 p-2 border rounded-xs bg-secondary border-tertiary">
                            {children}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default BaseModal;
