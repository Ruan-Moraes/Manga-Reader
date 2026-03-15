export const RATING_CATEGORIES = [
    {
        key: 'funRating',
        label: 'Diversão',
        icon: '🎉',
        description:
            'Considere a leveza, humor e entretenimento proporcionados pela obra.',
    },
    {
        key: 'artRating',
        label: 'Arte',
        icon: '🎨',
        description:
            'Avalie a qualidade dos traços, painéis, cenários e estilo visual.',
    },
    {
        key: 'storylineRating',
        label: 'Enredo',
        icon: '📖',
        description:
            'Considere a estrutura narrativa, ritmo da história e originalidade.',
    },
    {
        key: 'charactersRating',
        label: 'Personagens',
        icon: '👤',
        description:
            'Avalie o desenvolvimento, carisma e profundidade dos personagens.',
    },
    {
        key: 'originalityRating',
        label: 'Originalidade',
        icon: '💡',
        description: 'Considere o quão inovadora e única é a proposta da obra.',
    },
    {
        key: 'pacingRating',
        label: 'Ritmo',
        icon: '⏱',
        description:
            'Avalie o andamento dos capítulos, se é bem distribuído e envolvente.',
    },
] as const;

export type RatingCategory = (typeof RATING_CATEGORIES)[number];
