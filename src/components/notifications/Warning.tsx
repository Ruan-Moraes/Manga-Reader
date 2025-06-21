import { COLORS } from '../../constants/COLORS';

import CustomLink from '../links/elements/CustomLink';

type WarningTypes = {
    linkText?: string;
    color: COLORS;
    title: string;
    message: string;
    link?: string;
};

const Warning = ({ linkText, color, title, message, link }: WarningTypes) => {
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
                    <CustomLink
                        link={link}
                        className={`text-sm text-${color}-default hover:text-${color}-normal`}
                        text={linkText}
                    />
                </div>
            )}
            {!link && !linkText && (
                <div className="text-center">
                    <CustomLink
                        link="/"
                        className={`text-sm text-${color}-default hover:text-${color}-normal`}
                        text="Voltar para a página inicial"
                    />
                </div>
            )}
        </div>
    );
};

export default Warning;
