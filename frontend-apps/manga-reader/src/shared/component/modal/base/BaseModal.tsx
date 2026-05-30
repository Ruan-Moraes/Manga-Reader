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
                    <div className="fixed left-1/2 top-1/2 z-20 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col gap-2">
                        <div className="z-20 flex w-full flex-col gap-2 rounded-xs border border-tertiary bg-secondary p-2">{children}</div>
                    </div>
                </>
            )}
        </>
    );
};

export default BaseModal;
