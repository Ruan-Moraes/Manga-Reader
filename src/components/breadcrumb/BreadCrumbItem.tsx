interface IBreadCrumbItem {
  text: string;
  href: string;
  isCurrentPage?: boolean;
}

const BreadCrumbItem = ({ text, href, isCurrentPage }: IBreadCrumbItem) => {
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

export default BreadCrumbItem;
