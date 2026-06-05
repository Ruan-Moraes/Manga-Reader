import { ROUTES } from '@shared/constant/ROUTES';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { EmptyState } from '@ui/EmptyState';

import { GroupHeader } from './parts/GroupHeader';
import { GroupMembers } from './parts/GroupMembers';
import { GroupWorks } from './parts/GroupWorks';

const GROUPS: Record<
    string,
    {
        id: string;
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
        works: Array<{
            id: string;
            title: string;
            author?: string;
            cover?: string;
            rating?: number;
            chapter?: number;
        }>;
        membersList: Array<{ name: string; role: string; joinedAt: string }>;
    }
> = {
    '1': {
        id: '1',
        name: 'Scan Brasileiro',
        handle: '@scan-br',
        status: 'active',
        verified: true,
        members: 1240,
        projects: 58,
        chaptersPublished: 3400,
        avgDays: 7,
        bio: 'O maior e mais respeitado grupo de tradução de mangás do Brasil desde 2012. Focados em Seinen e Josei de alta qualidade, com revisão técnica e lettering profissional.',
        tags: ['Seinen', 'Josei', 'pt-BR'],
        works: [
            { id: '1', title: 'Berserk', rating: 4.9, chapter: 370 },
            { id: '2', title: 'Vagabond', rating: 4.9, chapter: 327 },
            { id: '3', title: 'Vinland Saga', rating: 4.8, chapter: 210 },
            { id: '4', title: 'Frieren', rating: 4.9, chapter: 120 },
            { id: '5', title: 'Dungeon Meshi', rating: 4.8, chapter: 97 },
            { id: '6', title: 'Homunculus', rating: 4.7, chapter: 201 },
        ],
        membersList: [
            { name: 'akira_scan', role: 'Fundador', joinedAt: 'mar 2012' },
            { name: 'lettering_br', role: 'Lettering', joinedAt: 'jun 2013' },
            { name: 'revisor_01', role: 'Revisor', joinedAt: 'jan 2015' },
            { name: 'trad_pt', role: 'Tradutor', joinedAt: 'ago 2017' },
            { name: 'clean_master', role: 'Limpeza', joinedAt: 'fev 2020' },
            { name: 'qc_sato', role: 'QC', joinedAt: 'out 2021' },
        ],
    },
};

const GroupProfile = () => {
    const { groupId } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('group');
    const [following, setFollowing] = useState(false);
    const [tab, setTab] = useState('works');

    const group = GROUPS[groupId ?? ''] ?? GROUPS['1'];

    if (!group) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <EmptyState
                    illustration="404"
                    title={t('profile.notFoundTitle')}
                    description={t('profile.notFoundDesc')}
                    action={
                        <Button variant="primary" onClick={() => navigate(ROUTES.GROUPS)}>
                            {t('profile.backToGroupsShort')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer asMain size="default" paddingY="md">
            <GroupHeader group={group} following={following} activeTab={tab} onFollowToggle={() => setFollowing(f => !f)} onTabChange={setTab} />

            {tab === 'works' && <GroupWorks works={group.works} onWorkClick={id => navigate(ROUTES.TITLE_DETAIL(id))} />}

            {tab === 'activity' && (
                <div className="flex flex-col gap-3">
                    {[
                        { title: 'Berserk', chapter: 370, when: 'há 2 dias' },
                        { title: 'Vagabond', chapter: 327, when: 'há 5 dias' },
                        { title: 'Frieren', chapter: 120, when: 'há 1 semana' },
                        {
                            title: 'Dungeon Meshi',
                            chapter: 97,
                            when: 'há 2 semanas',
                        },
                    ].map(item => (
                        <div key={item.title} className="flex items-center gap-3 rounded-mr-md border border-mr-border bg-mr-surface px-4 py-3">
                            <div className="size-10 shrink-0 rounded-mr-xs bg-mr-tertiary/20" />
                            <div className="flex-1">
                                <p className="text-mr-small font-mr-bold text-mr-fg">{item.title}</p>
                                <p className="text-mr-tiny text-mr-fg-muted">
                                    {t('profile.chapterPublished', {
                                        chapter: item.chapter,
                                    })}
                                </p>
                            </div>
                            <span className="text-mr-tiny text-mr-fg-subtle">{item.when}</span>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'members' && <GroupMembers members={group.membersList} />}

            {tab === 'about' && (
                <div className="max-w-[640px]">
                    <Card variant="default" className="p-6">
                        <h2 className="mb-3 text-mr-h3 font-mr-extrabold text-mr-fg">{t('profile.aboutTitle')}</h2>
                        <p className="mb-6 text-mr-small leading-relaxed text-mr-fg-muted">{group.bio}</p>

                        <h3 className="mb-2 text-mr-small font-mr-bold text-mr-fg">{t('profile.languagesTitle')}</h3>
                        <div className="mb-6 flex gap-2">
                            {group.tags.map(tag => (
                                <Badge key={tag} variant="neutral">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h3 className="mb-2 text-mr-small font-mr-bold text-mr-fg">{t('profile.findUs')}</h3>
                        <div className="flex flex-col gap-1 text-mr-small text-mr-accent">
                            <a href="#" className="hover:underline">
                                Discord
                            </a>
                            <a href="#" className="hover:underline">
                                Twitter / X
                            </a>
                            <a href="#" className="hover:underline">
                                contato@scan-br.com
                            </a>
                        </div>
                    </Card>
                </div>
            )}
        </PageContainer>
    );
};

export default GroupProfile;
