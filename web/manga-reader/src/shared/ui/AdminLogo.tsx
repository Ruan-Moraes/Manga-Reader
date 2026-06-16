// TODO: Usar a logo classifica do projeto e deletar essa.

import { useState } from 'react';

type LogoTypes = {
    size?: 'xs' | 'sm' | 'md';
};

const sizeClasses = {
    xs: { container: 'w-6 h-6', img: 'w-4 h-4', text: 'text-mr-body', sub: 'text-[0.5rem]', gap: 'gap-1.5' },
    sm: { container: 'w-8 h-8', img: 'w-6 h-6', text: 'text-mr-h4', sub: 'text-[0.6rem]', gap: 'gap-2' },
    md: { container: 'w-9 h-9', img: 'w-7 h-7', text: 'text-[18px]', sub: 'text-[10px]', gap: 'gap-2.5' },
} as const;

const AdminLogo = ({ size = 'md' }: LogoTypes) => {
    const [logoError, setLogoError] = useState<boolean>(false);

    const s = sizeClasses[size];

    return (
        <div className={`flex min-w-0 items-center ${s.gap}`}>
            <div className={`flex shrink-0 items-center justify-center ${s.container} rounded-mr-xs border border-mr-tertiary bg-mr-accent-25`}>
                {logoError ? (
                    <span className="text-mr-tiny font-mr-extrabold text-mr-accent">MR</span>
                ) : (
                    <img
                        src={`${import.meta.env.BASE_URL}/android-chrome-512x512.png`}
                        alt="Manga Reader"
                        className={s.img}
                        onError={() => setLogoError(true)}
                    />
                )}
            </div>
            <span className="flex min-w-0 flex-col leading-none">
                <span className={`${s.text} font-mr-extrabold italic tracking-[0.04em] whitespace-nowrap text-mr-fg`}>
                    Manga <b className="font-mr-extrabold text-mr-accent">Reader</b>
                </span>
                <span className={`${s.sub} mt-0.5 font-mr-bold uppercase tracking-[0.12em] text-mr-fg-subtle`}>Dashboard</span>
            </span>
        </div>
    );
};

export default AdminLogo;
