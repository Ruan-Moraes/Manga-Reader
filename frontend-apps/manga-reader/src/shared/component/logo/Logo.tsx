import { useState } from 'react';

const Logo = () => {
    const [logoError, setLogoError] = useState<boolean>(false);

    return (
        <div className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-quaternary-opacity-25 rounded-xs border border-tertiary">
                {logoError ? (
                    <span className="text-sm font-bold">MR</span>
                ) : (
                    <img
                        src="/assets/logo.png"
                        alt="Logo do Manga Reader"
                        className="w-8 h-8 "
                        onError={() => setLogoError(true)}
                    />
                )}
            </div>
            <div>
                <h1 className="font-bold leading-[1.25rem]">Manga Reader</h1>
                <p className="text-[0.65rem] text-primary-default/70">
                    Dashboard
                </p>
            </div>
        </div>
    );
};

export default Logo;
