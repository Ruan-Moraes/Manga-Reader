import { useState } from 'react';

type LogoSize = 'xs' | 'sm' | 'md';

type LogoTypes = {
    size?: LogoSize;
    onNavigate: (path: string) => void;
    ariaLabel?: string;
};

const sizeMap: Record<LogoSize, { img: number; text: string; gap: string }> = {
    xs: { img: 22, text: 'text-[14px]', gap: 'gap-2' },
    sm: { img: 24, text: 'text-[16px]', gap: 'gap-2' },
    md: { img: 26, text: 'text-[18px]', gap: 'gap-[10px]' },
};

const Logo = ({ size = 'md', onNavigate, ariaLabel = 'Manga Reader, ir para home' }: LogoTypes) => {
    const [logoError, setLogoError] = useState<boolean>(false);

    const dims = sizeMap[size];

    return (
        <button type="button" onClick={() => onNavigate('/')} aria-label={ariaLabel} className={`flex items-center ${dims.gap} cursor-pointer mr-focus-ring`}>
            <span
                className="flex items-center justify-center overflow-hidden"
                style={{ width: dims.img, height: dims.img, borderRadius: 3 }}
                aria-hidden="true"
            >
                {logoError ? (
                    <span className="text-[10px] font-mr-extrabold text-mr-fg">MR</span>
                ) : (
                    <img
                        src={`${import.meta.env.BASE_URL}/favicon-64x64.png`}
                        alt=""
                        width={dims.img}
                        height={dims.img}
                        className="block size-full object-contain"
                        onError={() => setLogoError(true)}
                    />
                )}
            </span>
            <span className={`italic font-mr-extrabold leading-none text-mr-fg ${dims.text}`} style={{ letterSpacing: '1.2px' }}>
                Manga <span className="text-mr-accent">Reader</span>
            </span>
        </button>
    );
};

export default Logo;
