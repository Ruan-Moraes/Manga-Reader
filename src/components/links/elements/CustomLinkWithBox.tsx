import { Link } from 'react-router-dom';

type CustomLinkWithBoxTypes = {
  className?: string;
  href: string;
  text: string;
};

const CustomLinkWithBox = ({ href, text }: CustomLinkWithBoxTypes) => {
  const isExternalLink = href.includes('http');

  return (
    <Link to={isExternalLink ? href : '/Manga-Reader' + href}>{text}</Link>
  );
};

export default CustomLinkWithBox;
