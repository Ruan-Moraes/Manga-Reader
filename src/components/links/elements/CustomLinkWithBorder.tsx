import { Link } from 'react-router-dom';

type CustomLinkWithBorderProps = {
  href: string;
  otherStyles?: React.CSSProperties;
  text: string;
};

const CustomLinkWithBorder = ({
  href,
  otherStyles,
  text,
}: CustomLinkWithBorderProps) => {
  const isExternalLink = href.includes('http');

  return (
    <Link
      to={isExternalLink ? href : '/Manga-Reader' + href}
      style={otherStyles || {}}
      className="p-2 duration-300 border-b-2 border-b-tertiary transition-text-shadow hover:text-shadow-highlight"
    >
      {text}
    </Link>
  );
};

export default CustomLinkWithBorder;
