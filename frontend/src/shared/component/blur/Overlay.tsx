import { useEffect } from 'react';

type OverlayTypes = {
    isOpen: boolean;
    onClickBlur: React.Dispatch<React.SetStateAction<boolean>>;
};

const Overlay = ({ isOpen, onClickBlur }: OverlayTypes) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        if (!isOpen) {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleBlur = () => {
        onClickBlur(false);
    };

    return (
        <div
            className={`fixed z-20 top-0 bottom-0 left-0 right-0 backdrop-blur-xs ${
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={handleBlur}
            style={{
                transition: 'opacity 300ms',
            }}
        ></div>
    );
};

export default Overlay;
