import CustomLink from '../elements/CustomLink';

type FooterLinksSectionTypes = {
    className?: string;
    title: string;
    links: { url: string; text: string }[];
};

const FooterLinksSection = ({
                                className,
                                title,
                                links,
                            }: FooterLinksSectionTypes) => {
    return (
        <div className={`bg-primary-default ${className}`}>
            <div className="p-2 font-bold text-center border-2 rounded-xs rounded-b-none border-tertiary">
                <h2 className="text-shadow-highlight">{title}</h2>
            </div>
            <div
                className="flex flex-col px-2 text-sm text-center border-2 border-t-0 rounded-xs rounded-t-none border-tertiary">
                {links.map((link, index) => {
                    const {url, text} = link;

                    return (
                        <CustomLink
                            key={index}
                            link={url}
                            text={text}
                            className={`flex items-center justify-center h-10 px-2 font-normal border-b-tertiary ${
                                index === links.length - 1 ? 'border-b-0' : 'border-b'
                            }`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default FooterLinksSection;
