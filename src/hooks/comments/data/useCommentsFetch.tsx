import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { CommentTypes } from '../../../types/CommentTypes';

const useCommentsFetch = (
    url: string,
    queryKey: string,
): UseQueryResult<CommentTypes[] | Error> => {
    return useQuery<CommentTypes[], Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Ocorreu um erro ao buscar os comentários');
            }

            // const data: CommentTypes[] = await response.json();

            // TODO: Remover o mock de dados quando a API estiver disponível
            // Mock de dados dos comentários
            const mockComments: CommentTypes[] = [
                {
                    id: '1856c659-5e1d-4750-9777-74e3496e01da',
                    user: {
                        id: '1',
                        name: 'Usuário de alta periculosidade',
                        photo: 'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
                        moderator: {
                            isModerator: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: true,
                    isHighlighted: true,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '42',
                    dislikeCount: '3',
                },
                {
                    id: '3dd84f94-dd37-4bb2-aa91-990c61b44719',
                    parentCommentId: '1856c659-5e1d-4750-9777-74e3496e01da',
                    user: {
                        id: '2',
                        name: 'Naruto Uzumaki',
                        photo: 'https://storage.googleapis.com/pod_public/1300/207360.jpg',
                        member: {
                            isMember: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: false,
                    wasEdited: true,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '15',
                    dislikeCount: '7',
                },
                {
                    id: 'cb64cd92-65f4-47c2-b64b-9f7080928041',
                    parentCommentId: '1856c659-5e1d-4750-9777-74e3496e01da',
                    user: {
                        id: '3',
                        name: 'Sasuke Uchiha',
                        photo: 'https://boo-prod.b-cdn.net/database/profiles/16779658133692cab7e879edd111139eefe3687a5e51c.jpg?class=sm',
                    },
                    isOwner: false,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?',
                    likeCount: '28',
                    dislikeCount: '1',
                },
                {
                    id: 'f1b0c4a2-3d5e-4f8b-8c7d-9a6e0f1b2c3e',
                    user: {
                        id: '2',
                        name: 'Naruto Uzumaki',
                        photo: 'https://storage.googleapis.com/pod_public/1300/207360.jpg',
                        member: {
                            isMember: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: false,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '56',
                    dislikeCount: '12',
                },
                {
                    id: '34c6b2c6-59fc-4ac3-bddc-76d4f73ccc38',
                    parentCommentId: 'f1b0c4a2-3d5e-4f8b-8c7d-9a6e0f1b2c3e',
                    user: {
                        id: '1',
                        name: 'Usuário de alta periculosidade',
                        photo: 'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
                        moderator: {
                            isModerator: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: true,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '33',
                    dislikeCount: '5',
                },
                {
                    id: 'e2f3b4c5-6d7e-4f8b-9a0b-1c2d3e4f5g6h',
                    parentCommentId: '34c6b2c6-59fc-4ac3-bddc-76d4f73ccc38',
                    user: {
                        id: '4',
                        name: 'Hinata Hyuga',
                        photo: 'https://pt.quizur.com/_image?href=https%3A%2F%2Fimg.quizur.com%2Ff%2Fimg631b0d291bede6.24534360.jpg%3FlastEdited%3D1662717231&w=600&h=600&f=webp',
                        moderator: {
                            isModerator: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: false,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '19',
                    dislikeCount: '4',
                },
                {
                    id: 'f7g8h9i0-j1k2-3l4m-5n6o-7p8q9r0s1t2u',
                    parentCommentId: 'e2f3b4c5-6d7e-4f8b-9a0b-1c2d3e4f5g6h',
                    user: {
                        id: '1',
                        name: 'Usuário de alta periculosidade',
                        photo: 'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
                        moderator: {
                            isModerator: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: true,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '47',
                    dislikeCount: '8',
                },
                {
                    id: 'v3w4x5y6-z7a8-9b0c-1d2e-3f4g5h6i7j8k',
                    parentCommentId: 'f7g8h9i0-j1k2-3l4m-5n6o-7p8q9r0s1t2u',
                    user: {
                        id: '1',
                        name: 'Usuário de alta periculosidade',
                        photo: 'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
                        moderator: {
                            isModerator: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: true,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
                    likeCount: '24',
                    dislikeCount: '6',
                },
                {
                    id: 'd1e2f3g4-h5i6-7j8k-9l0m-1n2o3p4q5r6s',
                    user: {
                        id: '4',
                        name: 'Hinata Hyuga',
                        photo: 'https://pt.quizur.com/_image?href=https%3A%2F%2Fimg.quizur.com%2Ff%2Fimg631b0d291bede6.24534360.jpg%3FlastEdited%3D1662717231&w=600&h=600&f=webp',
                        member: {
                            isMember: true,
                            since: new Date('2023-06-01T19:21:56.000Z'),
                        },
                    },
                    isOwner: false,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    imageContent:
                        'https://t.ctcdn.com.br/LH0-pVW87nALWza-n2YXafNP-ng=/768x432/smart/i598772.jpeg',
                    likeCount: '38',
                    dislikeCount: '2',
                },
                {
                    id: '1b0dd1ca-a78d-4e60-980b-c13470c58de2',
                    parentCommentId: 'd1e2f3g4-h5i6-7j8k-9l0m-1n2o3p4q5r6s',
                    user: {
                        id: '5',
                        name: 'Sakura Haruno',
                        photo: 'https://cdn.ome.lt/uno0VMDEDgYjPNHHzp01Pxpzs6M=/987x0/smart/uploads/conteudo/fotos/Design_sem_nome-346.png',
                    },
                    isOwner: false,
                    createdAt: '2025-06-01T19:21:56.000Z',
                    textContent:
                        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?',
                    imageContent:
                        'https://c0.klipartz.com/pngpicture/77/557/gratis-png-kyon-anime-manga-internet-meme-haruhi-suzumiya-anime.png',
                    likeCount: '51',
                    dislikeCount: '9',
                },
            ];

            return mockComments;

            // return data;
        },

        staleTime: 0, // Não vou guardar os comentários em cache, pois eles são atualizados frequentemente
    });
};

export default useCommentsFetch;
