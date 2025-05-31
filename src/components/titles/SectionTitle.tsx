import CustomLink from '../links/elements/CustomLink';

type SectionTitleTypes = {
    children?: React.ReactNode;
    titleStyleClasses?: string;
    title: string;
    subTitle?: string;
    subLink?: string;
};

const SectionTitle = ({
                          children,
                          titleStyleClasses,
                          title,
                          subTitle,
                          subLink,
                      }: SectionTitleTypes) => {
    return (
        <div className={children ? 'flex flex-col gap-2' : ' flex flex-col'}>
            <div>
                <div>
                    <h2
                        className={`font-bold ${
                            titleStyleClasses ? titleStyleClasses : 'text-2xl'
                        }`}
                    >
                        {title}
                    </h2>
                </div>
                <div>
                    {subTitle && !subLink && (
                        <p className="text-xs text-quaternary-default">{subTitle}</p>
                    )}
                    {subTitle && subLink && (
                        <p className="leading-0">
                            <CustomLink
                                link={subLink}
                                text={subTitle}
                                className="text-xs text-quaternary-default"
                            />
                        </p>
                    )}
                </div>
            </div>
            {children && <div>{children}</div>}
        </div>
    );
};

export default SectionTitle;
