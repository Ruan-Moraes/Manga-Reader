interface IBreadCrumbItem {
  text: string;
  href: string;
  isCurrentPage?: boolean;
}

const BreadCrumbItem = ({ text, href, isCurrentPage }: IBreadCrumbItem) => {
  return (
    <div>
      <a
        href={href}
        {...(isCurrentPage && { 'aria-current': 'page' })}
        {...(isCurrentPage && {
          className: 'text-quaternary-default font-bold',
        })}
      >
        {text}
      </a>
      <span className="mx-2 font-bold">/</span>
    </div>
  );
};

export default BreadCrumbItem;
