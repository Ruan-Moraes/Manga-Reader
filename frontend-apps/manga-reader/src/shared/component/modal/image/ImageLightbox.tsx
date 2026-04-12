import { useCallback, useEffect } from 'react';
import { IoCloseOutline, IoImageOutline } from 'react-icons/io5';

type ImageLightboxProps = {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    alt: string;
};

const ImageLightbox = ({ isOpen, onClose, src, alt }: ImageLightboxProps) => {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        },
        [onClose],
    );

    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            className="fixed inset-0 z-30 flex items-center justify-center"
        >
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xs"
                style={{ transition: 'opacity 300ms' }}
            />

            <div className="relative z-10 flex flex-col items-center gap-3 mx-4 max-w-full max-h-full">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar visualização"
                    className="self-end p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                    <IoCloseOutline size={28} />
                </button>

                {src ? (
                    <img
                        src={src}
                        alt={alt}
                        className="object-contain max-h-[80vh] w-auto rounded-xs"
                        style={{ transition: 'opacity 300ms' }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-64 h-64 bg-secondary rounded-xs">
                        <IoImageOutline size={64} className="text-tertiary" />
                        <span className="mt-2 text-sm text-tertiary">
                            Imagem não disponível
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageLightbox;
