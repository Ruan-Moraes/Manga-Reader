import { useLocation } from 'react-router-dom';

import Item from './BreadCrumbItem';

const BreadCrumbContainer = () => {
  const { pathname } = useLocation();

  const urlArray = pathname
    .split('/')
    .filter((item) => item && item !== 'Manga-Reader');

  return (
    <>
      {urlArray.length > 0 &&
        urlArray.map((item, index) => (
          <nav
            key={index}
            className="flex items-center p-2 overflow-x-scroll text-xs border-b-2 break-keep whitespace-nowrap border-b-tertiary"
          >
            <Item
              text={item}
              href={`/${item}`}
              isCurrentPage={index === urlArray.length - 1}
            />
          </nav>
        ))}
    </>
  );
};

export default BreadCrumbContainer;
