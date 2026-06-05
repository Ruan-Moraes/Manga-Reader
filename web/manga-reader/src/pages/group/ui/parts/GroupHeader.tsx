import { useTranslation } from 'react-i18next';
import { Share2, CheckCircle2, Users, BookOpen, Layers } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { StatusDot } from '@ui/StatusDot';
import { Tabs } from '@ui/Tabs';

const STATUS_KIND: Record<string, 'operating' | 'degraded' | 'idle'> = {
    active: 'operating',
    hiatus: 'degraded',
    inactive: 'idle',
};

interface GroupHeaderProps {
    group: {
        name: string;
        handle: string;
        status: 'active' | 'hiatus' | 'inactive';
        verified: boolean;
        members: number;
        projects: number;
        chaptersPublished: number;
        avgDays: number;
        bio: string;
        tags: string[];
    };
    following: boolean;
    activeTab: string;
    onFollowToggle: () => void;
    onTabChange: (tab: string) => void;
}

export const GroupHeader = ({ group, following, activeTab, onFollowToggle, onTabChange }: GroupHeaderProps) => {
    const { t } = useTranslation('group');

    const STATUS_LABEL: Record<string, string> = {
        active: t('header.statusActive'),
        hiatus: t('header.statusHiatus'),
        inactive: t('header.statusInactive'),
    };

    const TAB_ITEMS = [
        { value: 'works', label: t('header.tabs.works') },
        { value: 'activity', label: t('header.tabs.activity') },
        { value: 'members', label: t('header.tabs.members') },
        { value: 'about', label: t('header.tabs.about') },
    ];

    const stats = [
        {
            icon: Users,
            label: t('header.stats.followers'),
            value: group.members.toLocaleString(),
        },
        {
            icon: BookOpen,
            label: t('header.stats.works'),
            value: group.projects,
        },
        {
            icon: Layers,
            label: t('header.stats.chapters'),
            value: group.chaptersPublished.toLocaleString(),
        },
        {
            icon: undefined,
            label: t('header.stats.avgDays'),
            value: `~${group.avgDays}d`,
        },
    ];

    return (
        <>
            <div className="relative mb-8">
                <div
                    className="h-[140px] w-full rounded-mr-lg md:h-[200px]"
                    style={{
                        background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #1a1a1a)',
                    }}
                />

                <div className="relative px-4 md:px-6">
                    <div className="-mt-10 mb-3 md:-mt-12">
                        <Avatar name={group.name} size={96} />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <h1 className="text-mr-h2 font-mr-extrabold tracking-mr text-mr-fg">{group.name}</h1>
                                {group.verified && <CheckCircle2 className="size-5 text-mr-accent" aria-label={t('header.verifiedAria')} />}
                            </div>
                            <p className="mb-2 text-mr-small text-mr-fg-muted">{group.handle}</p>
                            <div className="mb-3 flex items-center gap-2 text-mr-tiny text-mr-fg-subtle">
                                <StatusDot status={STATUS_KIND[group.status]} size={8} />
                                <span>{STATUS_LABEL[group.status]}</span>
                            </div>
                            <div className="mb-3 flex flex-wrap gap-2">
                                {group.tags.map(tag => (
                                    <Badge key={tag} variant="neutral">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <p className="max-w-[540px] text-mr-small text-mr-fg-muted">{group.bio}</p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant={following ? 'raised' : 'primary'} onClick={onFollowToggle}>
                                {following ? t('header.following') : t('header.follow')}
                            </Button>
                            <Button variant="raised" icon={Share2}>
                                {t('header.share')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <dl className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.label} variant="flat" className="p-4">
                        <dt className="mb-1 text-mr-tiny text-mr-fg-subtle">{stat.label}</dt>
                        <dd className="text-mr-h3 font-mr-extrabold text-mr-fg">{stat.value}</dd>
                    </Card>
                ))}
            </dl>

            <div className="mb-6">
                <Tabs items={TAB_ITEMS} value={activeTab} onChange={onTabChange} variant="underline" />
            </div>
        </>
    );
};
