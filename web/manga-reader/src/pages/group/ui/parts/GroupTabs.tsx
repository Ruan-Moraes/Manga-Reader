// TODO: Refotara isso e dividir as responsabilidades em arquivos.

import { useTranslation } from 'react-i18next';
import { Compass, MessagesSquare, Newspaper, type LucideIcon } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { MangaCard } from '@entities/manga';
import type { Group } from '@entities/group';

const Heading = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-3 text-mr-tiny font-mr-extrabold uppercase tracking-[0.08em] text-mr-accent">{children}</div>
);

const SocialRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
    <div className="flex items-center gap-2.5 border-t border-[#2d2d2d] py-2 first:border-t-0">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent-10 text-mr-accent">
            <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
            <div className="text-mr-tiny font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">{label}</div>
            <div className="truncate text-mr-small tracking-mr text-mr-fg">{value}</div>
        </div>
    </div>
);

export const GroupAbout = ({ group }: { group: Group }) => {
    const { t } = useTranslation('group');

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
                <Heading>{t('profile.aboutHeading')}</Heading>
                <p className="mb-[18px] text-mr-body leading-[1.7] text-mr-gray-200">{group.description}</p>

                <Heading>{t('profile.genresHeading')}</Heading>
                <div className="mb-[18px] flex flex-wrap gap-1.5">
                    {group.genres.map(g => (
                        <Badge key={g} variant="neutral">
                            {g}
                        </Badge>
                    ))}
                </div>
            </div>

            <aside className="self-start rounded-mr-sm border border-[#333] bg-mr-gray-900 p-3.5">
                <Heading>{t('profile.whereToFind')}</Heading>
                {/* TODO: Transforma em link, porem quando o usuario clicar vai abrir um modal falando que esta saindo do dominio do manga reader*/}
                {group.website && <SocialRow icon={Newspaper} label={t('profile.socialSite')} value={group.website} />}
                {/* TODO: Transforma em link, porem quando o usuario clicar vai abrir um modal falando que esta saindo do dominio do manga reader*/}
                {group.username && <SocialRow icon={Compass} label="Twitter" value={`@${group.username}`} />}
                {!group.website && !group.username && <div className="py-2 text-mr-small text-mr-fg-muted">{t('profile.noSocials')}</div>}
                <span className="hidden">
                    <MessagesSquare />
                </span>
            </aside>
        </div>
    );
};

export const GroupWorks = ({ group, onOpenTitle }: { group: Group; onOpenTitle: (id: string) => void }) => {
    const { t } = useTranslation('group');

    const works = group.translatedWorks ?? [];

    if (!works.length) return <div className="px-5 py-10 text-center text-mr-small text-mr-fg-muted">{t('profile.worksEmpty')}</div>;

    return (
        <div>
            <Heading>{t('profile.worksCount', { count: works.length })}</Heading>
            <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {works.map(w => (
                    <MangaCard
                        key={w.id}
                        size="sm"
                        manga={{ id: w.id, title: w.title, cover: w.cover, chapter: w.chapters, genre: w.genres }}
                        onClick={() => onOpenTitle(w.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export const GroupTeam = ({ group }: { group: Group }) => {
    const { t } = useTranslation('group');

    return (
        <div>
            <Heading>{t('profile.teamCount', { count: group.members.length })}</Heading>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {/* TODO: Ser um link que vai levar na pagina do usuario */}
                {group.members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 rounded-mr-sm border border-[#333] bg-mr-gray-900 p-3">
                        <Avatar src={m.avatar || undefined} name={m.name} size={40} />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-mr-small font-mr-bold tracking-mr text-mr-fg">{m.name}</div>
                            <div className="text-mr-tiny font-mr-bold tracking-mr text-mr-accent">{m.role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GroupDiscussion = ({ onViewForum }: { onViewForum: () => void }) => {
    const { t } = useTranslation('group');

    return (
        <div>
            <Heading>{t('profile.discussionHeading')}</Heading>
            <div className="rounded-mr-sm border border-[#333] bg-mr-gray-900 px-5 py-10 text-center">
                <div className="mb-3 text-mr-small leading-normal text-mr-gray-200">{t('profile.discussionText')}</div>
                <Button variant="ghost" onClick={onViewForum}>
                    {t('profile.viewInForum')}
                </Button>
            </div>
        </div>
    );
};
