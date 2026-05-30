// data-events.js — eventos especiais e normais
window.eventStatus = function(ev, now = new Date()) {
  const start = new Date(ev.start + 'T00:00:00');
  const end = new Date(ev.end + 'T23:59:59');
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
};

window.EVENTS = [
  {
    id:'evt-shounen-arena', type:'special',
    name:'Shounen Arena: Torneio dos Heróis',
    tagline:'O maior crossover de shounens do ano',
    description:'Quatro semanas de batalhas em capítulos exclusivos, ranking semanal da comunidade e recompensas raras para quem participar até o fim.',
    cover:'linear-gradient(135deg,#ff784f 0%,#ddda2a 100%)',
    coverPattern:'rays',
    start:'2026-05-01', end:'2026-05-31',
    badge:'Especial', accent:'#ff784f',
    rewards:['Avatar exclusivo','Capítulo bônus','Badge de perfil'],
    participants:12847, chapters:24,
  },
  {
    id:'evt-aniversario', type:'special',
    name:'Aniversário Manga Reader: 3 anos',
    tagline:'Três anos lendo junto. Tem festa.',
    description:'Capítulos liberados, sorteios diários, lives com tradutores, e um grand finale com obra inédita revelada na última noite.',
    cover:'linear-gradient(135deg,#7c3aed 0%,#ddda2a 100%)',
    coverPattern:'confetti',
    start:'2026-04-20', end:'2026-05-20',
    badge:'Especial', accent:'#ddda2a',
    rewards:['10 capítulos premium grátis','Sorteio de mangás físicos','Tema escuro neon'],
    participants:38291, chapters:60,
  },
  {
    id:'evt-halloween', type:'special',
    name:'Noite Sombria: Especial Horror',
    tagline:'Mangás de terror em destaque',
    description:'Curadoria de horror clássico e moderno com leituras guiadas, debates por capítulo e capa dark mode exclusiva durante o evento.',
    cover:'linear-gradient(135deg,#3a1f47 0%,#ff784f 100%)',
    coverPattern:'fog',
    start:'2026-10-20', end:'2026-11-02',
    badge:'Especial', accent:'#a855f7',
    rewards:['Tema noturno','Avatar fantasma','Coleção horror'],
    participants:0, chapters:14,
  },
  {
    id:'evt-leitura-coletiva-fr', type:'normal',
    name:'Leitura coletiva: Fire Force',
    description:'Cinco capítulos por dia, discussões abertas no fórum.',
    cover:'#ff784f',
    start:'2026-05-05', end:'2026-05-12', chapters:35,
  },
  {
    id:'evt-clube-shoujo', type:'normal',
    name:'Clube do mês: Shoujo clássico',
    description:'Curadoria de cinco shoujos dos anos 90 para revisitar.',
    cover:'#ec4899',
    start:'2026-05-01', end:'2026-05-31', chapters:48,
  },
  {
    id:'evt-quiz-otaku', type:'normal',
    name:'Quiz Otaku Semanal',
    description:'Trinta perguntas. Ranking sobe na sexta. Top 10 ganha avatar.',
    cover:'#ddda2a',
    start:'2026-05-08', end:'2026-05-08', chapters:0,
  },
  {
    id:'evt-fanart-marco', type:'normal',
    name:'Concurso de fanart: Março',
    description:'Tema livre. Júri da comunidade vota até dia 31.',
    cover:'#3b82f6',
    start:'2026-03-01', end:'2026-03-31', chapters:0,
  },
  {
    id:'evt-maratona-isekai', type:'normal',
    name:'Maratona Isekai',
    description:'Trinta e seis horas de leitura ininterrupta com badges por hora.',
    cover:'#10b981',
    start:'2026-06-15', end:'2026-06-16', chapters:120,
  },
  {
    id:'evt-traducao-aberta', type:'normal',
    name:'Tradução aberta: Capítulo 1000',
    description:'Acompanhe a tradução ao vivo com os scans parceiros.',
    cover:'#06b6d4',
    start:'2026-05-15', end:'2026-05-15', chapters:1,
  },
];
