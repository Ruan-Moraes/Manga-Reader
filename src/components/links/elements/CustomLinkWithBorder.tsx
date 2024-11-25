import { Link } from 'react-router-dom';

interface ICustomLinkWithBorder {
  href: string;
  text: string;
  otherStyles?: React.CSSProperties;
}

const CustomLinkWithBorder = ({
  href,
  text,
  otherStyles,
}: ICustomLinkWithBorder) => {
  return (
    <Link
      to={href}
      style={otherStyles || {}}
      className="p-2 duration-500 border-b-2 border-b-tertiary transition-text-shadow hover:text-shadow-highlight"
    >
      {text}
    </Link>
  );
};

export default CustomLinkWithBorder;
