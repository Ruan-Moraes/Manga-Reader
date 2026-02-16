import { type GroupMember, type Group, type GroupWork } from '@feature/group';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createPosts = (memberId: string, baseTitle: string) =>
    Array.from({ length: 4 }).map((_, index) => ({
        id: `${memberId}-post-${index + 1}`,
        summary: `Atualização de ${baseTitle}: revisão ${index + 1} concluída e capítulo encaminhado para publicação.`,
        createdAt: new Date(
            Date.now() - (index + 1) * 86400000 * 2,
        ).toISOString(),
        titleName: `Obra ${index + 1}`,
        link: '/news',
    }));

const makeMember = (
    id: string,
    name: string,
    role: GroupMember['role'],
    avatarSeed: number,
): GroupMember => ({
    id,
    name,
    role,
    avatar: `https://i.pravatar.cc/240?img=${avatarSeed}`,
    bio: `${name} atua como ${role.toLowerCase()} e participa de projetos semanais focados em qualidade e consistência.`,
    joinedAt: new Date(
        2021,
        avatarSeed % 10,
        (avatarSeed % 25) + 1,
    ).toISOString(),
    groups: [],
    recentPosts: createPosts(id, name),
});

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------

export const worksPool: GroupWork[] = [
    {
        id: '1',
        title: 'Chronicles of Dawn',
        cover: 'https://picsum.photos/220/320?random=201',
        chapters: 123,
        status: 'ongoing',
        popularity: 95,
        updatedAt: '2026-01-12',
        genres: ['Ação', 'Fantasia'],
    },
    {
        id: '2',
        title: 'Silent Garden',
        cover: 'https://picsum.photos/220/320?random=202',
        chapters: 89,
        status: 'completed',
        popularity: 84,
        updatedAt: '2025-11-20',
        genres: ['Drama', 'Romance'],
    },
    {
        id: '3',
        title: 'Violet Trigger',
        cover: 'https://picsum.photos/220/320?random=203',
        chapters: 47,
        status: 'ongoing',
        popularity: 77,
        updatedAt: '2026-02-01',
        genres: ['Ação', 'Urbano'],
    },
    {
        id: '4',
        title: 'Myth of Polaris',
        cover: 'https://picsum.photos/220/320?random=204',
        chapters: 112,
        status: 'completed',
        popularity: 88,
        updatedAt: '2025-08-14',
        genres: ['Aventura', 'Histórico'],
    },
    {
        id: '5',
        title: 'Neon Kitchen',
        cover: 'https://picsum.photos/220/320?random=205',
        chapters: 36,
        status: 'ongoing',
        popularity: 72,
        updatedAt: '2026-01-29',
        genres: ['Comédia', 'Slice of Life'],
    },
    {
        id: '6',
        title: 'Blade Sonata',
        cover: 'https://picsum.photos/220/320?random=206',
        chapters: 132,
        status: 'completed',
        popularity: 91,
        updatedAt: '2024-12-03',
        genres: ['Ação', 'Seinen'],
    },
    {
        id: '7',
        title: 'Re:District Zero',
        cover: 'https://picsum.photos/220/320?random=207',
        chapters: 64,
        status: 'ongoing',
        popularity: 79,
        updatedAt: '2026-01-24',
        genres: ['Mistério', 'Suspense'],
    },
    {
        id: '8',
        title: 'Moonlit Contract',
        cover: 'https://picsum.photos/220/320?random=208',
        chapters: 52,
        status: 'ongoing',
        popularity: 74,
        updatedAt: '2026-02-07',
        genres: ['Romance', 'Sobrenatural'],
    },
];

export const membersPool: GroupMember[] = [
    makeMember('m-1', 'Aline Tanaka', 'Líder', 11),
    makeMember('m-2', 'Goku A.', 'Tradutor(a)', 12),
    makeMember('m-3', 'Marta S.', 'Revisor(a)', 13),
    makeMember('m-4', 'Yuri K.', 'Typesetter', 14),
    makeMember('m-5', 'Renata Lima', 'Líder', 15),
    makeMember('m-6', 'Piero Costa', 'QC', 16),
    makeMember('m-7', 'Kaio N.', 'Tradutor(a)', 17),
    makeMember('m-8', 'Dri Melo', 'Revisor(a)', 18),
    makeMember('m-9', 'Nina Park', 'Líder', 19),
    makeMember('m-10', 'Saki Ito', 'Cleaner', 20),
    makeMember('m-11', 'Leo Duarte', 'Tradutor(a)', 21),
    makeMember('m-12', 'Miya Ono', 'QC', 22),
    makeMember('m-13', 'Karla Ruiz', 'Líder', 23),
    makeMember('m-14', 'Dante Fox', 'Revisor(a)', 24),
    makeMember('m-15', 'Igor N.', 'Typesetter', 25),
    makeMember('m-16', 'Clara V.', 'Tradutor(a)', 26),
    makeMember('m-17', 'Bruno M.', 'QC', 27),
];

const getMembers = (ids: string[]) =>
    membersPool.filter(member => ids.includes(member.id));

const pickWorks = (ids: string[]) =>
    worksPool.filter(work => ids.includes(work.id));

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export const mockGroups: Group[] = [
    {
        id: 'g-1',
        name: 'Mirai Scans',
        logo: 'https://picsum.photos/400/400?random=31',
        banner: 'https://picsum.photos/1280/360?random=131',
        description:
            'Especialistas em ação e fantasia com fluxo semanal e revisão colaborativa.',
        website: 'https://mangadex.org',
        totalTitles: 6,
        foundedYear: 2019,
        platformJoinedAt: '2019-03-14',
        status: 'active',
        members: getMembers(['m-1', 'm-2', 'm-3', 'm-4', 'm-17']),
        genres: ['Ação', 'Fantasia', 'Aventura'],
        rating: 4.8,
        popularity: 98,
        translatedWorks: pickWorks(['1', '4', '6', '7', '8', '3']),
        translatedTitleIds: ['1', '4', '6', '7', '8', '3'],
    },
    {
        id: 'g-2',
        name: 'Lótus Team',
        logo: 'https://picsum.photos/400/400?random=32',
        banner: 'https://picsum.photos/1280/360?random=132',
        description:
            'Equipe focada em drama e slice of life, com edição refinada.',
        website: 'https://myanimelist.net',
        totalTitles: 4,
        foundedYear: 2020,
        platformJoinedAt: '2020-06-10',
        status: 'active',
        members: getMembers(['m-5', 'm-6', 'm-7', 'm-8', 'm-16']),
        genres: ['Drama', 'Slice of Life', 'Romance'],
        rating: 4.5,
        popularity: 89,
        translatedWorks: pickWorks(['2', '5', '8', '3']),
        translatedTitleIds: ['2', '5', '8', '3'],
    },
    {
        id: 'g-3',
        name: 'Nexus Mangás',
        logo: 'https://picsum.photos/400/400?random=33',
        banner: 'https://picsum.photos/1280/360?random=133',
        description: 'Grupo veterano com catálogo extenso e alta curadoria.',
        website: 'https://anilist.co',
        totalTitles: 8,
        foundedYear: 2016,
        platformJoinedAt: '2017-01-03',
        status: 'inactive',
        members: getMembers(['m-8', 'm-14', 'm-15', 'm-11', 'm-12', 'm-16']),
        genres: ['Seinen', 'Mistério', 'Thriller'],
        rating: 4.2,
        popularity: 75,
        translatedWorks: pickWorks(['1', '2', '4', '6', '7', '8']),
        translatedTitleIds: ['1', '2', '4', '6', '7', '8'],
    },
    {
        id: 'g-4',
        name: 'Aurora Scan',
        logo: 'https://picsum.photos/400/400?random=34',
        banner: 'https://picsum.photos/1280/360?random=134',
        description:
            'Traduções de romances escolares e comédia com lançamentos quinzenais.',
        website: 'https://www.reddit.com',
        totalTitles: 3,
        foundedYear: 2021,
        platformJoinedAt: '2021-08-26',
        status: 'active',
        members: getMembers(['m-9', 'm-10', 'm-3', 'm-7']),
        genres: ['Romance', 'Comédia', 'Escolar'],
        rating: 4.4,
        popularity: 81,
        translatedWorks: pickWorks(['2', '5', '8']),
        translatedTitleIds: ['2', '5', '8'],
    },
    {
        id: 'g-5',
        name: 'Kitsune Project',
        logo: 'https://picsum.photos/400/400?random=35',
        banner: 'https://picsum.photos/1280/360?random=135',
        description: 'Equipe em hiato que prioriza projetos especiais curtos.',
        website: 'https://www.wikipedia.org',
        totalTitles: 3,
        foundedYear: 2022,
        platformJoinedAt: '2022-11-09',
        status: 'hiatus',
        members: getMembers(['m-11', 'm-12', 'm-4', 'm-15']),
        genres: ['Sobrenatural', 'Drama', 'Suspense'],
        rating: 4,
        popularity: 62,
        translatedWorks: pickWorks(['5', '3', '7']),
        translatedTitleIds: ['5', '3', '7'],
    },
    {
        id: 'g-6',
        name: 'Vortex BR',
        logo: 'https://picsum.photos/400/400?random=36',
        banner: 'https://picsum.photos/1280/360?random=136',
        description:
            'Foco em aventura e mistério com revisão técnica detalhada.',
        website: 'https://www.crunchyroll.com',
        totalTitles: 5,
        foundedYear: 2023,
        platformJoinedAt: '2023-05-21',
        status: 'active',
        members: getMembers(['m-13', 'm-14', 'm-15', 'm-6', 'm-2']),
        genres: ['Aventura', 'Mistério', 'Ação'],
        rating: 4.7,
        popularity: 92,
        translatedWorks: pickWorks(['1', '6', '7', '4', '3']),
        translatedTitleIds: ['1', '6', '7', '4', '3'],
    },
    {
        id: 'g-7',
        name: 'Pixel Ink',
        logo: 'https://picsum.photos/400/400?random=37',
        banner: 'https://picsum.photos/1280/360?random=137',
        description:
            'Time pequeno especializado em webtoons de fantasia urbana.',
        website: 'https://www.webtoons.com',
        totalTitles: 3,
        foundedYear: 2024,
        platformJoinedAt: '2024-01-17',
        status: 'active',
        members: getMembers(['m-16', 'm-17', 'm-10', 'm-12']),
        genres: ['Fantasia', 'Urbano', 'Ação'],
        rating: 4.1,
        popularity: 66,
        translatedWorks: pickWorks(['3', '8', '5']),
        translatedTitleIds: ['3', '8', '5'],
    },
    {
        id: 'g-8',
        name: 'Old Pages',
        logo: 'https://picsum.photos/400/400?random=38',
        banner: 'https://picsum.photos/1280/360?random=138',
        description:
            'Equipe histórica em pausa, conhecida por obras clássicas completas.',
        website: 'https://www.goodreads.com',
        totalTitles: 4,
        foundedYear: 2015,
        platformJoinedAt: '2016-04-02',
        status: 'inactive',
        members: getMembers(['m-1', 'm-5', 'm-8', 'm-14', 'm-17']),
        genres: ['Clássico', 'Drama', 'Histórico'],
        rating: 3.9,
        popularity: 58,
        translatedWorks: pickWorks(['2', '4', '6', '1']),
        translatedTitleIds: ['2', '4', '6', '1'],
    },
];

// Cross-link members → groups
const groupNameById = new Map(mockGroups.map(g => [g.id, g.name]));

mockGroups.forEach(group => {
    group.members.forEach(member => {
        if (!member.groups.find(mg => mg.id === group.id)) {
            member.groups.push({ id: group.id, name: group.name });
        }
    });
});

export { groupNameById };
