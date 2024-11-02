const BreadCrumb_Item = ({
  text,
  href,
  isCurrentPage,
}: {
  text: string;
  href: string;
  isCurrentPage?: boolean;
}) => {
  return (
    <li>
      <a
        href={href}
        className={isCurrentPage ? 'text-quaternary-default font-bold' : ''}
      >
        {text}
      </a>
      <span className="mx-2 font-bold">/</span>
    </li>
  );
};

export default BreadCrumb_Item;
