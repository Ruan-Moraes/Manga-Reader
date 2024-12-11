import { Link } from 'react-router-dom';

type CustomLinkWithBoxProps = {
  href: string;
  text: string;
  classNames?: string;
};

const CustomLinkWithBox = ({
  href,
  text,
  classNames,
}: CustomLinkWithBoxProps) => {
  const isExternalLink = href.includes('http');

  return (
    <Link
      to={isExternalLink ? href : '/Manga-Reader' + href}
      className={`p-2 font-bold text-center duration-300 border-2 rounded-sm bg-secondary transition-text-shadow hover:text-shadow-highlight border-tertiary ${classNames}`}
    >
      {text}
    </Link>
  );
};

export default CustomLinkWithBox;
