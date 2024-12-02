import { Link } from 'react-router-dom';

interface ICustomLinkWithBox {
  href: string;
  text: string;
  otherStyles?: React.CSSProperties;
}

const CustomLinkWithBox = ({ href, text, otherStyles }: ICustomLinkWithBox) => {
  return (
    <Link
      to={'/Manga-Reader' + href}
      style={otherStyles || {}}
      className="p-2 font-bold text-center duration-500 border-2 rounded-sm bg-secondary transition-text-shadow hover:text-shadow-highlight border-tertiary"
    >
      {text}
    </Link>
  );
};

export default CustomLinkWithBox;
