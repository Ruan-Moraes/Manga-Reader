import { COLORS } from '../../constants/COLORS';

import CustomLink from '../links/elements/CustomLink';

type WarningTypes = {
  linkText?: string;
  color: COLORS;
  title: string;
  message: string;
  href?: string;
};

const Warning = ({ linkText, color, title, message, href }: WarningTypes) => {
  return (
    <div
      className={`w-full${linkText ? ' flex flex-col items-center gap-2' : ''}`}
    >
      <div
        className={`flex flex-col items-center justify-center gap-2 p-4 text-center border-2 rounded-xs border-${color}-default`}
      >
        <div>
          <h2>
            <span className={`text-xl font-bold text-${color}-default`}>
              {title}
            </span>
          </h2>
        </div>
        <div className="text-xs">
          <p>{message}</p>
        </div>
      </div>
      {href && (
        <div className="text-center">
          <CustomLink
            href={href || '/'}
            className={`text-sm text-${color}-default hover:text-${color}-normal`}
            text={linkText || 'Voltar'}
          />
        </div>
      )}
    </div>
  );
};

export default Warning;
