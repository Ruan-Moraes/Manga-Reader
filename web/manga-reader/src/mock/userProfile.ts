/**
 * Resíduo mock do perfil (DT-48): header/stats/resenhas/listas/grupos seguidos/
 * seguidores já vêm do backend — restou apenas o feed de atividade, que ainda
 * não tem agregação no servidor (ver docs/tech-debt.md).
 */
// TODO(tech-debt): substituir por endpoint de activity feed quando existir.
export const ACTIVITY = [
    { text: 'Leu o capítulo 370 de Berserk', when: 'há 2h' },
    { text: 'Publicou uma resenha de Vinland Saga', when: 'há 2 semanas' },
    { text: 'Marcou Attack on Titan como concluído', when: 'há 1 mês' },
    { text: 'Passou a seguir Wonder Scans', when: 'há 2 meses' },
];
