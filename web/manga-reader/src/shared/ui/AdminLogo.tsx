import { useState } from 'react';

type LogoTypes = {
    size?: 'xs' | 'sm' | 'md';
};

const AdminLogo = ({ size = 'md' }: LogoTypes) => {
    const [logoError, setLogoError] = useState<boolean>(false);

    const sizeClasses = {
        xs: {
            container: 'w-6 h-6',
            img: 'w-4 h-4',
            text: 'text-sm',
            gap: 'gap-1',
            dashboard: 'text-[0.5rem]',
        },
        sm: {
            container: 'w-8 h-8',
            img: 'w-6 h-6',
            text: 'text-base',
            gap: 'gap-1.5',
            dashboard: 'text-[0.6rem]',
        },
        md: {
            container: 'w-10 h-10',
            img: 'w-8 h-8',
            text: 'text-lg',
            gap: 'gap-2',
            dashboard: 'text-[0.65rem]',
        },
    };

    const currentSize = sizeClasses[size];

    return (
        <div className={`flex items-center ${currentSize.gap} ${currentSize.text}`}>
            <div className={`flex items-center justify-center ${currentSize.container} bg-quaternary-opacity-25 rounded-xs border border-tertiary`}>
                {logoError ? (
                    <span className="text-xs font-bold">MR</span>
                ) : (
                    <img
                        src={`${import.meta.env.BASE_URL}/android-chrome-512x512.png`}
                        alt="AdminLogo do Manga Reader"
                        className={currentSize.img}
                        onError={() => setLogoError(true)}
                    />
                )}
            </div>
            <div>
                <h1 className="font-bold leading-tight">Manga Reader</h1>
                <p className={`${currentSize.dashboard} text-primary-default/70`}>Dashboard</p>
            </div>
        </div>
    );
};

export default AdminLogo;
