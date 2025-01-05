import { Link } from 'react-router-dom';

type CustomLinkWithBoxProps = {
  className?: string;
  href: string;
  text: string;
};

const CustomLinkWithBox = ({
  className,
  href,
  text,
}: CustomLinkWithBoxProps) => {
  const isExternalLink = href.includes('http');

  return (
    <Link
      className={`p-2 font-bold text-xs mobile-md:text-base text-center duration-300 border rounded-sm bg-secondary transition-text-shadow hover:text-shadow-highlight border-tertiary ${className}`}
      to={isExternalLink ? href : '/Manga-Reader' + href}
    >
      {text}
    </Link>
  );
};

export default CustomLinkWithBox;
