import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LinksSection from '@shared/component/link/section/FooterLinksSection';

type FooterTypes = {
    styles?: React.CSSProperties;
    showLinks?: boolean;
};

const Footer = ({ styles, showLinks }: FooterTypes) => {
    const { t } = useTranslation('layout');

    const getYear = useMemo(() => {
        return new Date().getFullYear();
    }, []);

    return (
        <footer
            className="mt-auto bg-secondary lg:max-w-6xl lg:mx-auto"
            style={styles}
        >
            {!showLinks && (
                <div className="grid grid-cols-8 items-center gap-4 p-4 border-t-2 border-t-tertiary">
                    <LinksSection
                        title={t('footer.usefulLinks')}
                        className="col-span-4"
                        links={[
                            { url: '/', text: t('footer.links.home') },
                            {
                                url: '/filter',
                                text: t('footer.links.filter'),
                            },
                            { url: '/news', text: t('footer.links.news') },
                            {
                                url: '/events',
                                text: t('footer.links.events'),
                            },
                            { url: '/forum', text: t('footer.links.forum') },
                            {
                                url: '/groups',
                                text: t('footer.links.groups'),
                            },
                        ]}
                    />
                    <LinksSection
                        className="col-span-4"
                        title={t('footer.socialMedia')}
                        links={[
                            { url: '#', text: 'Discord' },
                            { url: '#', text: 'X (Twitter)' },
                            { url: '#', text: 'Facebook' },
                            { url: '#', text: 'Instagram' },
                        ]}
                    />
                    <LinksSection
                        className="col-span-6 col-start-2"
                        title={t('footer.otherLinks')}
                        links={[
                            {
                                url: '/i-want-to-publish-work',
                                text: t('footer.links.publishWork'),
                            },
                            {
                                url: 'https://ko-fi.com/',
                                text: t('footer.links.donate'),
                            },
                            {
                                url: '/about-us',
                                text: t('footer.links.aboutUs'),
                            },
                            { url: '/dmca', text: t('footer.links.dmca') },
                            {
                                url: '/terms-of-use',
                                text: t('footer.links.termsOfUse'),
                            },
                        ]}
                    />
                </div>
            )}
            <div className="p-2 text-xs text-center border-t-2 bg-primary-default border-t-tertiary text-shadow-default">
                <p>{t('footer.copyright', { year: getYear })}</p>
            </div>
        </footer>
    );
};

export default Footer;
