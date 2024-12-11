type BreadCrumbItemProps = {
  href: string;
  isCurrentPage?: boolean;
  text: string;
};

const BreadCrumbItem = ({ href, isCurrentPage, text }: BreadCrumbItemProps) => {
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
