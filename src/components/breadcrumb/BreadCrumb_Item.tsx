interface IBreadCrumb_Item {
  text: string;
  href: string;
  isCurrentPage?: boolean;
}

const BreadCrumb_Item = ({ text, href, isCurrentPage }: IBreadCrumb_Item) => {
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
