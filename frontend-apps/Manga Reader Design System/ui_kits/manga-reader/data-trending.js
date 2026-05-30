// data-trending.js — dados auxiliares para Em Alta + Lançamentos + Configurações

// Estatísticas extras por obra (views, novos capítulos, tendência)
window.MANGA_STATS = {
  op: { views: '12.4M', viewsWeek: '482k', lastCh: 1120, lastChWhen: 'hoje',       trend: '+18%', scan: 'Mangás Brasil' },
  bk: { views:  '4.1M', viewsWeek: '301k', lastCh:  364, lastChWhen: 'há 3 dias',  trend: '+12%', scan: 'Noturnos Scan' },
  sl: { views:  '8.9M', viewsWeek: '512k', lastCh:  200, lastChWhen: 'há 1 dia',   trend: '+34%', scan: 'Solo Translators' },
  jk: { views:  '6.7M', viewsWeek: '280k', lastCh:  268, lastChWhen: 'há 2 dias',  trend:  '-4%', scan: 'Jujutsu BR' },
  cs: { views:  '5.2M', viewsWeek: '410k', lastCh:  180, lastChWhen: 'há 4 horas', trend: '+22%', scan: 'Panda Scans' },
  fr: { views:  '3.6M', viewsWeek: '388k', lastCh:  140, lastChWhen: 'há 12 horas',trend: '+41%', scan: 'Elfo Scans' },
  vm: { views:  '2.9M', viewsWeek: '142k', lastCh:  214, lastChWhen: 'há 1 semana',trend:  '+6%', scan: 'Viking Tradutores' },
  mt: { views:  '2.1M', viewsWeek:  '98k', lastCh:  110, lastChWhen: 'há 5 dias',  trend:  '+3%', scan: 'Isekai BR' },
  dg: { views:  '4.8M', viewsWeek: '376k', lastCh:  182, lastChWhen: 'há 8 horas', trend: '+27%', scan: 'Dandadan Scans' },
  ks: { views:  '3.2M', viewsWeek: '201k', lastCh:  128, lastChWhen: 'há 2 dias',  trend: '+11%', scan: 'Kaiju Translations' },
};

// Feed bruto de lançamentos — uma entrada por capítulo lançado
// `t` é minutos desde agora. Ordenado, mais recente primeiro.
window.RELEASES = [
  { id:'r1',  mangaId:'cs', chapter:180, title:'O coração da serra',          scan:'Panda Scans',           pages:42, lang:'pt-BR', t:14,   verified:true,  hot:true  },
  { id:'r2',  mangaId:'dg', chapter:182, title:'Aiko sob a lua',              scan:'Dandadan Scans',        pages:38, lang:'pt-BR', t:128,  verified:true,  hot:true  },
  { id:'r3',  mangaId:'fr', chapter:140, title:'A última conversa',           scan:'Elfo Scans',            pages:36, lang:'pt-BR', t:300,  verified:true,  hot:false },
  { id:'r4',  mangaId:'op', chapter:1120,title:'O sino soa em Wano',          scan:'Mangás Brasil',         pages:19, lang:'pt-BR', t:420,  verified:true,  hot:true  },
  { id:'r5',  mangaId:'sl', chapter:200, title:'Epílogo do soberano',         scan:'Solo Translators',      pages:48, lang:'pt-BR', t:780,  verified:false, hot:false },
  { id:'r6',  mangaId:'jk', chapter:268, title:'Final de partida',            scan:'Jujutsu BR',            pages:25, lang:'pt-BR', t:1320, verified:true,  hot:false },
  { id:'r7',  mangaId:'op', chapter:1119,title:'A bandeira de Vegapunk',      scan:'Mangás Brasil',         pages:21, lang:'pt-BR', t:1450, verified:true,  hot:false },
  { id:'r8',  mangaId:'ks', chapter:128, title:'A frente da terceira divisão',scan:'Kaiju Translations',    pages:30, lang:'pt-BR', t:2880, verified:true,  hot:false },
  { id:'r9',  mangaId:'cs', chapter:179, title:'Despertar',                   scan:'Panda Scans',           pages:33, lang:'pt-BR', t:3160, verified:true,  hot:false },
  { id:'r10', mangaId:'bk', chapter:364, title:'A torre do feiticeiro',       scan:'Noturnos Scan',         pages:28, lang:'pt-BR', t:4320, verified:true,  hot:false },
  { id:'r11', mangaId:'vm', chapter:214, title:'Travessia',                   scan:'Viking Tradutores',     pages:24, lang:'pt-BR', t:10080,verified:false, hot:false },
  { id:'r12', mangaId:'mt', chapter:110, title:'O retorno de Eris',           scan:'Isekai BR',             pages:32, lang:'pt-BR', t:7200, verified:true,  hot:false },
  { id:'r13', mangaId:'dg', chapter:181, title:'Atravessando o portal',       scan:'Dandadan Scans',        pages:36, lang:'pt-BR', t:11520,verified:true,  hot:false },
  { id:'r14', mangaId:'fr', chapter:139, title:'Aurora de prata',             scan:'Elfo Scans',            pages:34, lang:'pt-BR', t:14400,verified:true,  hot:false },
  { id:'r15', mangaId:'sl', chapter:199, title:'Antes do trono',              scan:'Solo Translators',      pages:46, lang:'pt-BR', t:18720,verified:false, hot:false },
];

// Helper — minutos -> "há 5 min", "há 2 horas", "ontem", etc.
window.relativeTime = function(min) {
  if (min < 60)    return `há ${min} min`;
  if (min < 1440)  return `há ${Math.floor(min/60)} h`;
  if (min < 2880)  return 'ontem';
  if (min < 10080) return `há ${Math.floor(min/1440)} dias`;
  if (min < 43200) return `há ${Math.floor(min/10080)} sem.`;
  return `há ${Math.floor(min/43200)} meses`;
};

// Bucket de tempo para filtros
window.releaseBucket = function(min) {
  if (min < 1440)  return 'hoje';
  if (min < 10080) return 'semana';
  if (min < 43200) return 'mes';
  return 'antigo';
};

// Defaults globais do sistema (Configurações do Sistema)
window.SYSTEM_DEFAULTS = {
  // Leitor
  modoLeitura:   'vertical',   // vertical | horizontal | paginado
  direcao:       'rtl',        // ltr | rtl | webtoon
  preload:        3,           // páginas (0–10)
  qualidade:     'alta',       // auto | baixa | media | alta | original
  autoScroll:    false,
  velocidadeAutoScroll: 2,
  zoomPadrao:    100,          // %
  lazyLoad:      true,
  modoPagina:    'simples',    // simples | dupla | spread
  // Interface
  idiomaInterface: 'pt-BR',
  // Conteúdo
  idiomaPrincipal:  'pt-BR',
  fallbackAuto:     true,
  idiomasAtivos:    ['pt-BR', 'en'],
  prioridade:       ['pt-BR', 'en', 'es'],
};
