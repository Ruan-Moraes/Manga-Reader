import { THEME_COLORS } from '@shared/constant/THEME_COLORS';

import AppLink from '@shared/component/link/element/AppLink';

type WarningTypes = {
    color: THEME_COLORS;
    title: string;
    message: string;
    link?: string;
    linkText?: string;
};

const Warning = ({ color, title, message, link, linkText }: WarningTypes) => {
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div
                className={`flex flex-col items-center justify-center gap-2 p-4 text-center border-2 rounded-xs border-${color}-default`}
            >
                <div>
                    <h2>
                        <span
                            className={`text-xl font-bold text-${color}-default`}
                        >
                            {title}
                        </span>
                    </h2>
                </div>
                <div className="text-xs">
                    <p>{message}</p>
                </div>
            </div>
            {link && linkText && (
                <div className="text-center">
                    <AppLink
                        link={link}
                        className={`text-sm text-${color}-default hover:text-${color}-normal`}
                        text={linkText}
                    />
                </div>
            )}
        </div>
    );
};

export default Warning;
