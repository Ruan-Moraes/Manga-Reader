import { COLORS } from '../../constants/COLORS';

import CustomLinkBase from '../links/elements/CustomLinkBase';

interface IWarning {
  title: string;
  message: string;
  color: COLORS;
  href?: string;
  linkText?: string;
}

const Warning = ({ title, message, color, href, linkText }: IWarning) => {
  return (
    <div {...(linkText && { className: 'flex flex-col items-center gap-2' })}>
      <div
        className={`flex flex-col items-center justify-center gap-2 p-4 text-center border-2 rounded-sm border-${color}-default`}
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
      {href ||
        (linkText && (
          <div className="text-center">
            <CustomLinkBase
              href={'/'}
              text={linkText}
              className={`text-sm text-${color}-default hover:text-${color}-normal`}
            />
          </div>
        ))}
    </div>
  );
};

export default Warning;
