import { GrDocumentConfig } from 'react-icons/gr';

import { clearCache } from '../../../services/utils/cache.ts';

import CustomLink from '../elements/CustomLink';

const MenuLinkBlock = () => {
    return (
        <div className="flex flex-col h-full gap-4 px-4 pb-4">
            <div className="flex flex-col gap-1.5">
                <div>
                    <h3 className="font-bold">Gêneros Famosos</h3>
                </div>
                <div className="flex flex-col gap-1.5 pl-3">
                    <CustomLink
                        link="/categories?tags=Isekai"
                        text="Isekai"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=shounen"
                        text="Shounen"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=seinen"
                        text="Seinen"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=shoujo"
                        text="Shoujo"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="font-bold">Nacionais e Internacionais</h3>
                </div>
                <div className="flex flex-col gap-1.5 pl-3">
                    <CustomLink
                        link="/categories?tags=nacionais"
                        text="Nacional"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=mangas"
                        text="Mangas"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=manwhas"
                        text="Manhwas"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=manhuas"
                        text="Manhuas"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=Light%20Novels"
                        text="Novels"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="font-bold">Links úteis</h3>
                </div>
                <div className="flex flex-col gap-1.5 pl-3">
                    <CustomLink
                        link="/saved-mangas"
                        text="Meus salvos"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/groups"
                        text="Grupos"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/news"
                        text="Notícias"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/events"
                        text="Eventos"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                </div>
            </div>
            <div className="flex items-center w-full gap-2 mt-auto ml-auto text-center mobile-sm:text-xs mobile-md:text-sm">
                <button
                    onClick={clearCache}
                    className="h-10 px-4 font-bold border rounded-xs border-tertiary bg-secondary grow"
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
