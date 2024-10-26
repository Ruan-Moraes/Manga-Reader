import React from 'react';

interface ItemBreadCrumbProps {
  text: string;
  href?: string;
  isCurrentPage?: boolean;
}

const ItemBreadCrumb: React.FC<ItemBreadCrumbProps> = ({
  text,
  href,
  isCurrentPage,
}) => {
  return (
    <a
      href={href}
      className={isCurrentPage ? 'text-quaternary-normal font-bold' : ''}
    >
      {text}
    </a>
  );
};

export default ItemBreadCrumb;
