import { Link } from 'react-router-dom';

interface ICustomLinkBase {
  href: string;
  text: string;
  otherStyles?: React.CSSProperties;
}

const CustomLinkBase = ({ href, text, otherStyles }: ICustomLinkBase) => {
  return (
    <Link
      to={href}
      style={otherStyles || {}}
      className="font-bold text-center duration-500 transition-text-shadow hover:text-shadow-highlight"
    >
      {text}
    </Link>
  );
};

export default CustomLinkBase;
