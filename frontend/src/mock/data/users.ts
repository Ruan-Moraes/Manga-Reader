import { type User } from '@feature/auth';

/**
 * Pool de usuários simulados.
 * user-1 é o "usuário logado" (Leitor Demo).
 * Os demais aparecem em comentários, avaliações e interações.
 */
export const mockUsers: User[] = [
    {
        id: 'user-1',
        photo: 'https://i.pravatar.cc/100?img=32',
        name: 'Leitor Demo',
        bio: 'Fã de fantasia, ação e slice of life. Sempre em busca do próximo mangá para maratonar.',
        member: { isMember: true, since: new Date('2024-03-18') },
        socialMediasLinks: [
            { name: 'Twitter', link: 'https://twitter.com/leitordemo' },
            { name: 'Discord', link: 'https://discord.gg/leitordemo' },
        ],
        statistics: { comments: 28, likes: 74, dislikes: 2 },
        recommendedTitles: [
            {
                image: 'https://picsum.photos/300/450?random=r1',
                link: '/title/1',
            },
            {
                image: 'https://picsum.photos/300/450?random=r2',
                link: '/title/5',
            },
        ],
    },
    {
        id: 'user-2',
        photo: 'https://i.pravatar.cc/100?img=11',
        name: 'Mika Tanaka',
        bio: 'Apaixonada por shoujo e romance. Leitora ativa desde 2018.',
        member: { isMember: true, since: new Date('2023-06-12') },
        statistics: { comments: 45, likes: 120, dislikes: 5 },
    },
    {
        id: 'user-3',
        photo: 'https://i.pravatar.cc/100?img=15',
        name: 'Carlos Henrique',
        bio: 'Colecionador de edições físicas e entusiasta de seinen.',
        member: { isMember: true, since: new Date('2022-11-05') },
        statistics: { comments: 63, likes: 198, dislikes: 12 },
    },
    {
        id: 'user-4',
        photo: 'https://i.pravatar.cc/100?img=21',
        name: 'Ana Beatriz',
        bio: 'Tradutora amadora e revisora voluntária.',
        moderator: { isModerator: true, since: new Date('2024-01-10') },
        member: { isMember: true, since: new Date('2021-09-20') },
        statistics: { comments: 112, likes: 340, dislikes: 18 },
    },
    {
        id: 'user-5',
        photo: 'https://i.pravatar.cc/100?img=33',
        name: 'Rui Oliveira',
        bio: 'Fã de ação e isekai. Sempre comentando nos lançamentos.',
        statistics: { comments: 37, likes: 85, dislikes: 7 },
    },
    {
        id: 'user-6',
        photo: 'https://i.pravatar.cc/100?img=44',
        name: 'Ester Nakamura',
        bio: 'Designer e colorista de webcomics.',
        member: { isMember: true, since: new Date('2024-08-01') },
        statistics: { comments: 19, likes: 52, dislikes: 1 },
    },
    {
        id: 'user-7',
        photo: 'https://i.pravatar.cc/100?img=52',
        name: 'João Pedro',
        bio: 'Lê tudo o que encontra. Especialista em spoilers.',
        statistics: { comments: 88, likes: 210, dislikes: 31 },
    },
    {
        id: 'user-8',
        photo: 'https://i.pravatar.cc/100?img=60',
        name: 'Nina Park',
        bio: 'Manhwa stan. Coreia do Sul no coração.',
        member: { isMember: true, since: new Date('2023-03-15') },
        statistics: { comments: 54, likes: 167, dislikes: 9 },
    },
    {
        id: 'user-9',
        photo: 'https://i.pravatar.cc/100?img=12',
        name: 'Leo Duarte',
        bio: 'Cozinheiro e leitor de mangás culinários.',
        statistics: { comments: 22, likes: 48, dislikes: 3 },
    },
    {
        id: 'user-10',
        photo: 'https://i.pravatar.cc/100?img=19',
        name: 'Sakura Mendes',
        bio: 'Ilustradora e fã de horror japonês.',
        moderator: { isModerator: true, since: new Date('2025-02-14') },
        member: { isMember: true, since: new Date('2022-07-30') },
        statistics: { comments: 76, likes: 290, dislikes: 14 },
    },
    {
        id: 'user-11',
        photo: 'https://i.pravatar.cc/100?img=27',
        name: 'Dante Ferreira',
        bio: 'Lê mangá no metrô todo dia.',
        statistics: { comments: 41, likes: 93, dislikes: 6 },
    },
    {
        id: 'user-12',
        photo: 'https://i.pravatar.cc/100?img=35',
        name: 'Haru Yamamoto',
        bio: 'Estudante de japonês e tradutor iniciante.',
        member: { isMember: true, since: new Date('2025-01-08') },
        statistics: { comments: 15, likes: 34, dislikes: 2 },
    },
    {
        id: 'user-13',
        photo: 'https://i.pravatar.cc/100?img=40',
        name: 'Clara Vieira',
        bio: 'Bibliotecária e curadora de listas de mangá.',
        statistics: { comments: 33, likes: 78, dislikes: 4 },
    },
    {
        id: 'user-14',
        photo: 'https://i.pravatar.cc/100?img=48',
        name: 'Bruno Matsuda',
        bio: 'Colecionador de figuras e leitor voraz de shonen.',
        member: { isMember: true, since: new Date('2023-12-01') },
        statistics: { comments: 59, likes: 145, dislikes: 11 },
    },
    {
        id: 'user-15',
        photo: 'https://i.pravatar.cc/100?img=55',
        name: 'Kaori Lima',
        bio: 'Booktuber e resenhista de manhwas.',
        socialMediasLinks: [
            { name: 'YouTube', link: 'https://youtube.com/@kaorilima' },
            { name: 'Instagram', link: 'https://instagram.com/kaorilima' },
        ],
        statistics: { comments: 92, likes: 410, dislikes: 20 },
    },
];

export const getCurrentMockUser = () => mockUsers[0];
export const getMockUserById = (id: string) => mockUsers.find(u => u.id === id);
