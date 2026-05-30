import { useTranslation } from 'react-i18next';

import { HelpCircle, Languages, MessageCircle, Moon, GitBranch, Bird, Camera } from 'lucide-react';

import { Footer as DSFooter } from '@ui/Footer';
import type { FooterAppLink, FooterColumn, FooterLink, FooterPreferenceItem, FooterSocialLink, FooterStatusInfo } from '@ui/Footer';

import { useAuth } from '@feature/auth';
import useAppNavigate from '@shared/hook/useAppNavigate';

type FooterProps = {
    styles?: React.CSSProperties;
    showLinks?: boolean;
    onNavigate?: (path: string) => void;
    onSubscribe?: (email: string) => void | Promise<void>;
};

const mkLink = (label: string, path: string, onNavigate: (p: string) => void): FooterLink => ({
    label,
    href: path,
    onClick: (e: React.MouseEvent) => {
        if (!path.startsWith('http')) {
            e.preventDefault();
            onNavigate(path);
        }
    },
});

const mkExternal = (label: string, href: string): FooterLink => ({ label, href, external: true });

const Footer = ({ showLinks, onNavigate, onSubscribe }: FooterProps) => {
    const { t } = useTranslation('layout');
    const { isLoggedIn } = useAuth();

    const defaultNavigate = useAppNavigate();
    const navigate = onNavigate ?? defaultNavigate;

    const year = new Date().getFullYear();
    const copyright = t('footer.copyrightStudy', { year });

    if (showLinks) {
        return <DSFooter columns={[]} copyright={copyright} onBrandNavigate={navigate} />;
    }

    const accountLinks: FooterLink[] = isLoggedIn
        ? [
              mkLink(t('footer.links.profile'), '/profile', navigate),
              mkLink(t('footer.links.settings'), '/settings', navigate),
              mkLink(t('footer.links.notifications'), '/notifications', navigate),
          ]
        : [
              mkLink(t('footer.links.login'), '/login', navigate),
              mkLink(t('footer.links.signUp'), '/sign-up', navigate),
              mkLink(t('footer.links.settings'), '/settings', navigate),
          ];

    const columns: FooterColumn[] = [
        {
            title: t('footer.section.discover'),
            links: [
                mkLink(t('footer.links.home'), '/', navigate),
                mkLink(t('footer.links.trending'), '/trending', navigate),
                mkLink(t('footer.links.releases'), '/releases', navigate),
                mkLink(t('footer.links.filter'), '/filter', navigate),
            ],
        },
        {
            title: t('footer.section.library'),
            links: [
                mkLink(t('footer.links.myMangas'), '/library', navigate),
                mkLink(t('footer.links.reviews'), '/reviews', navigate),
                mkLink(t('footer.links.downloads'), '/library?tab=downloads', navigate),
                mkLink(t('footer.links.history'), '/history', navigate),
            ],
        },
        {
            title: t('footer.section.community'),
            links: [
                mkLink(t('footer.links.news'), '/news', navigate),
                mkLink(t('footer.links.events'), '/events', navigate),
                mkLink(t('footer.links.translationGroups'), '/groups', navigate),
                mkLink(t('footer.links.forum'), '/forum', navigate),
            ],
        },
        {
            title: t('footer.section.account'),
            links: accountLinks,
        },
        {
            title: t('footer.section.support'),
            links: [
                mkLink(t('footer.links.help'), '/help', navigate),
                mkLink(t('footer.links.contact'), '/legal/contact', navigate),
                mkLink(t('footer.links.dmca'), '/legal/dmca', navigate),
                mkLink(t('footer.links.aboutUs'), '/about-us', navigate),
            ],
        },
        {
            title: t('footer.section.legal'),
            links: [
                mkLink(t('footer.links.termsOfUse'), '/legal/terms', navigate),
                mkLink(t('footer.links.privacy'), '/legal/privacy', navigate),
                mkExternal(t('footer.links.donate'), 'https://ko-fi.com/'),
            ],
        },
    ];

    const apps: FooterAppLink[] = [
        {
            os: 'ios',
            label: t('footer.apps.downloadFor'),
            osName: 'iOS',
            href: '#',
            ariaLabel: t('footer.apps.iosAria'),
        },
        {
            os: 'android',
            label: t('footer.apps.downloadFor'),
            osName: 'Android',
            href: '#',
            ariaLabel: t('footer.apps.androidAria'),
        },
    ];

    const socials: FooterSocialLink[] = [
        { name: 'discord', href: 'https://discord.gg/', icon: MessageCircle, ariaLabel: 'Discord' },
        { name: 'twitter', href: 'https://twitter.com/', icon: Bird, ariaLabel: 'Twitter / X' },
        { name: 'instagram', href: 'https://instagram.com/', icon: Camera, ariaLabel: 'Instagram' },
        { name: 'github', href: 'https://github.com/', icon: GitBranch, ariaLabel: 'GitHub' },
    ];

    const statusInfo: FooterStatusInfo = {
        title: t('footer.statusBanner.title'),
        meta: t('footer.statusBanner.meta'),
        linkLabel: t('footer.statusBanner.link'),
        href: '/status',
        statusAriaLabel: t('footer.statusBanner.ariaLabel'),
    };

    const preferenceItems: FooterPreferenceItem[] = [
        {
            key: 'language',
            label: t('footer.preferences.language'),
            value: t('footer.preferences.languageValue'),
            icon: Languages,
            showChevron: true,
            ariaLabel: t('footer.preferences.languageAria'),
        },
        {
            key: 'theme',
            label: t('footer.preferences.theme'),
            value: t('footer.preferences.themeValue'),
            icon: Moon,
            showChevron: true,
            ariaLabel: t('footer.preferences.themeAria'),
        },
        {
            key: 'help',
            label: t('footer.preferences.help'),
            icon: HelpCircle,
            accent: true,
            ariaLabel: t('footer.preferences.helpAria'),
            onClick: () => navigate('/help'),
        },
    ];

    return (
        <DSFooter
            columns={columns}
            onSubscribe={onSubscribe}
            copyright={copyright}
            statusInfo={statusInfo}
            apps={apps}
            socials={socials}
            preferenceItems={preferenceItems}
            onBrandNavigate={navigate}
            texts={{
                tagline: t('footer.tagline'),
                newsletterLabel: t('footer.newsletter.label'),
                newsletterPlaceholder: t('footer.newsletter.placeholder'),
                newsletterSubmitAria: t('footer.newsletter.submitAria'),
                newsletterHint: t('footer.newsletter.hint'),
                newsletterSuccess: t('footer.newsletter.success'),
                appsLabel: t('footer.apps.label'),
                socialsLabel: t('footer.socials.label'),
                navAriaLabel: t('footer.navAriaLabel'),
                expandLabel: t('footer.expand'),
                collapseLabel: t('footer.collapse'),
            }}
        />
    );
};

export default Footer;
