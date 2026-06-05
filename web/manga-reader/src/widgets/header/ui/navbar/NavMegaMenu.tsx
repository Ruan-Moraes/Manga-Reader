import { useEffect, useRef } from 'react';
import { ChevronDown, Flame, Sparkles, Grid, Calendar, Users, MessageSquare, Star, Sliders, HelpCircle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

type Props = {
    openSection: string | null;
    onSectionChange: (key: string | null) => void;
    onNavigate: (path: string) => void;
};

type NavItem = {
    key: string;
    label: string;
    hint: string;
    icon: LucideIcon;
    path: string;
};

type NavSection = {
    key: string;
    label: string;
    items: NavItem[];
};

const HOVER_CLOSE_DELAY = 120;

const NavMegaMenu = ({ openSection, onSectionChange, onNavigate }: Props) => {
    const { t } = useTranslation('layout');

    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const NAV_SECTIONS: NavSection[] = [
        {
            key: 'discover',
            label: t('nav.section.discover'),
            items: [
                { key: 'trending', label: t('nav.item.trending'), hint: t('nav.hint.trending'), icon: Flame, path: '/trending' },
                { key: 'releases', label: t('nav.item.releases'), hint: t('nav.hint.releases'), icon: Sparkles, path: '/releases' },
                { key: 'categories', label: t('nav.item.categories'), hint: t('nav.hint.categories'), icon: Grid, path: '/filter' },
                { key: 'events', label: t('nav.item.events'), hint: t('nav.hint.events'), icon: Calendar, path: '/events' },
            ],
        },
        {
            key: 'community',
            label: t('nav.section.community'),
            items: [
                { key: 'groups', label: t('nav.item.translationGroups'), hint: t('nav.hint.translationGroups'), icon: Users, path: '/groups' },
                { key: 'forum', label: t('nav.item.forum'), hint: t('nav.hint.forum'), icon: MessageSquare, path: '/forum' },
                { key: 'reviews', label: t('nav.item.reviews'), hint: t('nav.hint.reviews'), icon: Star, path: '/reviews' },
            ],
        },
        {
            key: 'system',
            label: t('nav.section.system'),
            items: [
                { key: 'settings', label: t('nav.item.settings'), hint: t('nav.hint.settings'), icon: Sliders, path: '/settings' },
                { key: 'helpCenter', label: t('nav.item.helpCenter'), hint: t('nav.hint.helpCenter'), icon: HelpCircle, path: '/help' },
                { key: 'about', label: t('nav.item.about'), hint: t('nav.hint.about'), icon: Info, path: '/about' },
            ],
        },
    ];

    const cancelClose = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const scheduleClose = () => {
        cancelClose();
        closeTimerRef.current = setTimeout(() => onSectionChange(null), HOVER_CLOSE_DELAY);
    };

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) onSectionChange(null);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [onSectionChange]);

    useEffect(() => () => cancelClose(), []);

    return (
        <nav ref={containerRef} aria-label={t('nav.ariaMain')} className="hidden lg:flex items-center gap-[2px]">
            {NAV_SECTIONS.map(section => {
                const isOpen = openSection === section.key;
                return (
                    <div
                        key={section.key}
                        className="relative"
                        onMouseEnter={() => {
                            cancelClose();
                            onSectionChange(section.key);
                        }}
                        onMouseLeave={scheduleClose}
                    >
                        <button
                            type="button"
                            onClick={() => onSectionChange(isOpen ? null : section.key)}
                            aria-expanded={isOpen}
                            aria-haspopup="true"
                            className={cn(
                                'flex items-center gap-[5px] rounded-mr-xs px-3 py-[9px] text-mr-small font-mr-bold text-mr-fg transition-colors duration-mr-default',
                                'hover:bg-mr-accent-25 focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2',
                                isOpen && 'bg-mr-accent-25',
                            )}
                            style={{ letterSpacing: '0.0625rem' }}
                        >
                            {section.label}
                            <ChevronDown
                                aria-hidden="true"
                                className={cn('size-[15px] opacity-65 transition-transform duration-mr-default', isOpen && 'rotate-180 opacity-100')}
                            />
                        </button>
                        {isOpen && (
                            <>
                                {/* invisible hover bridge */}
                                <span aria-hidden="true" className="absolute left-0 right-0 top-full h-3" />
                                <div
                                    role="menu"
                                    onMouseEnter={cancelClose}
                                    onMouseLeave={scheduleClose}
                                    className="absolute left-0 top-[calc(100%+0.5rem)] min-w-[280px] border border-mr-gray-700 bg-mr-secondary p-2"
                                    style={{
                                        borderRadius: 8,
                                        boxShadow: '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25), 0 12px 40px -12px rgba(0,0,0,0.7)',
                                        zIndex: 50,
                                    }}
                                >
                                    {section.items.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                    onNavigate(item.path);
                                                    onSectionChange(null);
                                                }}
                                                className="flex w-full items-center gap-3 rounded-mr-xs p-[10px] text-left text-mr-fg transition-colors duration-mr-default hover:bg-mr-accent-25 focus-visible:outline-2 focus-visible:outline-mr-accent"
                                            >
                                                <span
                                                    className="flex shrink-0 items-center justify-center rounded-mr-xs"
                                                    style={{ width: 34, height: 34, background: 'rgba(221,218,42,0.10)', color: 'var(--mr-accent)' }}
                                                    aria-hidden="true"
                                                >
                                                    <Icon className="size-[18px]" strokeWidth={2} />
                                                </span>
                                                <span className="flex min-w-0 flex-col">
                                                    <span className="text-mr-small font-mr-bold leading-tight" style={{ letterSpacing: '0.0625rem' }}>
                                                        {item.label}
                                                    </span>
                                                    <span className="mt-[2px] text-[12px] leading-tight text-mr-gray-300">{item.hint}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default NavMegaMenu;
