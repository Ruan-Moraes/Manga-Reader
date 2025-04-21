import { GrDocumentConfig } from 'react-icons/gr';

import { clearCache } from '../../../main';

import LinkBox from '../../boxes/LinkBox';
import CustomLink from '../elements/CustomLink';

const MenuLinkBlock = () => {
  return (
    <div className="flex flex-col h-full gap-6 px-4 pb-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <LinkBox className="col-span-2">
          <CustomLink href="/categories?tags=shounen" text="Shounen" />
        </LinkBox>
        <LinkBox>
          <CustomLink
            href="/categories?tags=seinen"
            text="Seinen"
            className="hover:text-shadow-default"
          />
        </LinkBox>
        <LinkBox>
          <CustomLink
            href="/categories?tags=shoujo"
            text="Shoujo"
            className="hover:text-shadow-default"
          />
        </LinkBox>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <LinkBox className="col-span-2">
          <CustomLink href="/categories?tags=nacionais" text="Nacional" />
        </LinkBox>
        <LinkBox>
          <CustomLink href="/categories?tags=mangas" text="Mangas" />
        </LinkBox>
        <LinkBox>
          <CustomLink href="/categories?tags=manwhas" text="Manhwas" />
        </LinkBox>
        <LinkBox>
          <CustomLink href="/categories?tags=manhuas" text="Manhuas" />
        </LinkBox>
        <LinkBox>
          <CustomLink href="/categories?tags=Light%20Novels" text="Novels" />
        </LinkBox>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <LinkBox className="col-span-2">
          <CustomLink href="/groups" text="Grupos" />
        </LinkBox>
        <LinkBox>
          <CustomLink href="/news" text="Notícias" />
        </LinkBox>
        <LinkBox>
          <CustomLink href="/events" text="Eventos" />
        </LinkBox>
      </div>
      <div className="flex items-center w-full gap-2 mt-auto ml-auto text-center mobile-sm:text-xs mobile-md:text-sm">
        <button
          className="h-10 px-4 font-bold border rounded-xs border-tertiary bg-secondary grow"
          onClick={clearCache}
        >
          Limpar cache
        </button>
        <button className="h-10 px-4 border rounded-xs border-tertiary bg-secondary">
          <GrDocumentConfig className="text-2xl" />
        </button>
      </div>
    </div>
  );
};

export default MenuLinkBlock;
