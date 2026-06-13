// data-groups.js — grupos de tradução/scan (espelha a tela atual)
window.GROUP_STATUSES = ['Ativo', 'Inativo', 'Hiato'];
window.GROUP_STATUS_TONE = { 'Ativo': 'live', 'Hiato': 'open', 'Inativo': 'soon' };
window.MEMBER_ROLES = ['Líder', 'Tradutor', 'Editor', 'Revisor'];

const m = (name, role, color) => ({ name, role, color, initials: name.split(' ').map((w) => w[0]).slice(0, 2).join('') });

window.ADMIN_GROUPS = [
  { id: '42074904', name: 'Quantum Scans',       username: '@quantum-scans', status: 'Inativo', titles: 0, rating: 3.2, popularity: 12,  entrada: '10/06/2026',
    description: 'Grupo encerrado. Acervo transferido para outros grupos.', members: [] },
  { id: '70fbdf72', name: 'Lunar TL',            username: '@lunar-tl',      status: 'Ativo',   titles: 0, rating: 4.1, popularity: 30,  entrada: '10/06/2026',
    description: 'Tradução focada em manhwas de romance e drama.', members: [m('Min-jun Kim', 'Líder', '#ddda2a')] },
  { id: 'd6097f69', name: 'Solar Scans',         username: '@solar-scans',   status: 'Hiato',   titles: 0, rating: 3.8, popularity: 22,  entrada: '10/06/2026',
    description: 'Em pausa até o retorno da equipe principal.', members: [m('Aiko Tanaka', 'Líder', '#9bd')] },
  { id: '9a2af39c', name: 'Phoenix Manga',       username: '@phoenix-manga', status: 'Ativo',   titles: 1, rating: 4.5, popularity: 88,  entrada: '10/06/2026',
    description: 'Scan veterana especializada em shounen de longa data.', members: [m('Takeshi Yamamoto', 'Líder', '#ddda2a'), m('Yuki Sato', 'Tradutor', '#cccccc')] },
  { id: '23d809f1', name: 'Vortex Translations', username: '@vortex-tl',     status: 'Inativo', titles: 0, rating: 2.9, popularity: 5,   entrada: '10/06/2026',
    description: 'Sem atividade recente.', members: [] },
  { id: '53d40ec5', name: 'Eclipse Scans',       username: '@eclipse-scans', status: 'Inativo', titles: 0, rating: 3.1, popularity: 9,   entrada: '10/06/2026',
    description: 'Projeto pausado por tempo indeterminado.', members: [m('Carlos Henrique', 'Líder', '#cccccc')] },
  { id: '4b48b575', name: 'Aurora Manga',        username: '@aurora-manga',  status: 'Ativo',   titles: 1, rating: 4.0, popularity: 54,  entrada: '10/06/2026',
    description: 'Focada em obras de fantasia e aventura.', members: [] },
  { id: '58942c24', name: 'Polaris Translations',username: '@polaris-tl',    status: 'Hiato',   titles: 0, rating: 3.6, popularity: 18,  entrada: '10/06/2026',
    description: 'Retomada prevista para o próximo trimestre.', members: [m('Roberta Lima', 'Líder', '#ddda2a')] },
  { id: '96972006', name: 'Tempest Scans',       username: '@tempest-scans', status: 'Ativo',   titles: 3, rating: 4.7, popularity: 120, entrada: '10/06/2026',
    description: 'Lançamentos semanais de manhua de cultivo.', members: [m('Wei Chen', 'Líder', '#ddda2a'), m('Lan Yu', 'Editor', '#9bd')] },
  { id: '39086e4a', name: 'Sakura Scans',        username: '@sakura-scans',  status: 'Ativo',   titles: 2, rating: 4.6, popularity: 142, entrada: '10/06/2026',
    description: 'Comunidade de tradução colaborativa, aberta a novos voluntários.', members: [m('Sofia Cardoso', 'Líder', '#ddda2a'), m('Mika Tanaka', 'Tradutor', '#cccccc'), m('Diego Martins', 'Revisor', '#9bd')] },
];
