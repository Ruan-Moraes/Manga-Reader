// data.js — fake catalogue + news
window.MANGAS = [
  { id:'op', title:'One Piece', author:'Eiichiro Oda', genre:['Shounen','Aventura'], rating:4.9, ch:1120, status:'Em andamento', gradient:'linear-gradient(135deg,#2a1f0f,#161616)', initial:'OP', addedDays: 420, synopsis:'Monkey D. Luffy e sua tripulação atravessam o Grand Line em busca do maior tesouro do mundo — o One Piece. Uma saga de sonhos, amizade e liberdade que já dura mais de 25 anos.' },
  { id:'bk', title:'Berserk', author:'Kentaro Miura', genre:['Seinen','Dark Fantasy'], rating:4.9, ch:364, status:'Em andamento', gradient:'linear-gradient(135deg,#3a1f1f,#161616)', initial:'BK', addedDays: 200, synopsis:'A jornada de Guts, o Espadachim Negro, por um mundo medieval cheio de demônios, traições e vínculos partidos. A obra-prima sombria de Miura continua após sua morte pelas mãos do Studio Gaga.' },
  { id:'sl', title:'Solo Leveling', author:'Chugong', genre:['Manhwa','Ação'], rating:4.8, ch:200, status:'Completo', gradient:'linear-gradient(135deg,#1f2a3a,#161616)', initial:'SL', addedDays: 1, synopsis:'O caçador mais fraco do mundo ganha um sistema que só ele enxerga — e começa uma ascensão imparável rumo ao topo. Um dos manhwas mais populares da última década.' },
  { id:'jk', title:'Jujutsu Kaisen', author:'Gege Akutami', genre:['Shounen','Sobrenatural'], rating:4.7, ch:268, status:'Completo', gradient:'linear-gradient(135deg,#2a1f3a,#161616)', initial:'JK', addedDays: 5, synopsis:'Yuji Itadori engole um dedo amaldiçoado e se vê enredado no mundo de feiticeiros jujutsu. Uma mistura moderna e estilizada de horror, comédia e ação.' },
  { id:'cs', title:'Chainsaw Man', author:'Tatsuki Fujimoto', genre:['Shounen','Dark'], rating:4.8, ch:180, status:'Em andamento', gradient:'linear-gradient(135deg,#3a1010,#161616)', initial:'CS', addedDays: 2, synopsis:'Denji funde seu corpo ao do demônio Pochita e vira o Chainsaw Man — um matador de demônios com motosserras onde deveriam estar mãos e cabeça. Cru, honesto e inesquecível.' },
  { id:'fr', title:'Frieren', author:'Kanehito Yamada', genre:['Seinen','Fantasia'], rating:4.9, ch:140, status:'Em andamento', gradient:'linear-gradient(135deg,#1f3a2a,#161616)', initial:'FR', addedDays: 0, synopsis:'Uma maga elfa que sobreviveu ao herói e seus companheiros parte numa nova jornada — para entender o que significou conhecê-los. Um dos mangás mais tocantes da década.' },
  { id:'vm', title:'Vinland Saga', author:'Makoto Yukimura', genre:['Seinen','Histórico'], rating:4.9, ch:214, status:'Em andamento', gradient:'linear-gradient(135deg,#1a2a3a,#161616)', initial:'VM', addedDays: 90, synopsis:'Thorfinn cresce entre vikings numa espiral de vingança que ele vai precisar desfazer. Épico, filosófico e visualmente deslumbrante.' },
  { id:'mt', title:'Mushoku Tensei', author:'Rifujin na Magonote', genre:['Isekai','Fantasia'], rating:4.6, ch:110, status:'Em andamento', gradient:'linear-gradient(135deg,#2a3a1f,#161616)', initial:'MT', addedDays: 12, synopsis:'Um homem falido renasce num mundo de magia com todas as memórias da vida anterior. A premissa que definiu o gênero isekai moderno.' },
  { id:'dg', title:'Dandadan', author:'Yukinobu Tatsu', genre:['Shounen','Sobrenatural'], rating:4.8, ch:182, status:'Em andamento', gradient:'linear-gradient(135deg,#3a1f2a,#161616)', initial:'DD', addedDays: 3, synopsis:'Um garoto que acredita em fantasmas e uma garota que acredita em alienígenas descobrem que os dois têm razão. Caos visual, romance e porradaria sobrenatural.' },
  { id:'ks', title:'Kaiju No. 8', author:'Naoya Matsumoto', genre:['Shounen','Ação'], rating:4.6, ch:128, status:'Em andamento', gradient:'linear-gradient(135deg,#2a2a3a,#161616)', initial:'K8', addedDays: 7, synopsis:'Um operário da limpeza de kaijus ganha o poder de virar um deles. Ação direta, arte limpa e um protagonista mais velho — coisa rara em shounen.' },
];

window.COMMENTS = [
  { user:'AkariReads', initials:'AK', color:'#ddda2a', when:'há 2 horas', badge:'AUTOR', text:'Esse capítulo me deixou sem palavras. O ritmo do combate foi impecável e o flashback final arrematou tudo. Recomendo demais pra quem gosta de shounen com peso emocional.', up:128, down:2 },
  { user:'Kenji_99',   initials:'KJ', color:'#FF784F', when:'há 5 horas', text:'Concordo com tudo mas sinto que o arco anterior ficou um pouco arrastado. Torcendo pra retomarem o ritmo do arco de Marineford.', up:41, down:8 },
  { user:'YukiLove',   initials:'YL', color:'#cccccc', when:'ontem',      text:'Alguém mais chorou no painel da página 17? Porque eu não fui a única. Obra dos sonhos de verdade.', up:220, down:1 },
];

// News feed — app updates, manga world, community
window.NEWS = [
  { id:'n1', category:'APP',       when:'hoje',          title:'Novo sistema de recomendações personalizadas',
    excerpt:'A seção "Para você" agora aprende com o que você lê, favorita e avalia. Quanto mais você interage, melhor fica.',
    body:'Rodamos um modelo leve no cliente que cruza gêneros, autores e ritmos de leitura para sugerir obras que combinam com o seu histórico. Nada sai do seu dispositivo — privacidade em primeiro lugar.',
    tone:'#ddda2a', pinned:true },
  { id:'n2', category:'MUNDO',     when:'há 1 dia',      title:'Frieren anuncia arco final no Weekly Sunday',
    excerpt:'Kanehito Yamada confirmou em entrevista que a obra entra em sua reta final nos próximos capítulos.',
    body:'A autora reforçou que o ritmo contemplativo será mantido até o fim. A expectativa é que o arco final dure cerca de 40 capítulos.',
    tone:'#1f3a2a' },
  { id:'n3', category:'COMUNIDADE', when:'há 2 dias',    title:'Fórum da semana: debate sobre adaptações animadas',
    excerpt:'3.241 leitores estão discutindo se a adaptação de Chainsaw Man fez jus ao original. Venha defender seu ponto.',
    body:'O tópico já passou de 800 respostas. Participe com spoilers marcados e seja respeitoso com opiniões divergentes.',
    tone:'#3a1010' },
  { id:'n4', category:'APP',       when:'há 3 dias',     title:'Modo leitura vertical ganha snap suave',
    excerpt:'A rolagem do leitor agora ancora nos painéis maiores para uma leitura mais confortável no celular.',
    body:'A mudança está ativa por padrão e pode ser desligada em Configurações → Leitor. Feedback é muito bem-vindo.',
    tone:'#1f2a3a' },
  { id:'n5', category:'MUNDO',     when:'há 4 dias',     title:'Editora Panini anuncia edição de luxo de Berserk',
    excerpt:'Volume duplo em capa dura com sobrecapa fosca chega em agosto para o mercado brasileiro.',
    body:'A edição inclui páginas coloridas restauradas e um encarte de 32 páginas com arte inédita de Miura.',
    tone:'#3a1f1f' },
  { id:'n6', category:'COMUNIDADE', when:'há 5 dias',    title:'Grupos de scan ganham página dedicada',
    excerpt:'Agora cada grupo tem perfil, estatísticas de traduções e lista de obras em progresso.',
    body:'Estamos começando com os 20 maiores grupos ativos. Se você coordena um grupo, entre em contato para reivindicar o perfil.',
    tone:'#2a1f3a' },
];

// Seções do mega-menu — usado pelo NavigationMenu
window.NAV_SECTIONS = [
  { title:'Descobrir', items:[
    { key:'home',     label:'Início',             icon:'home',     hint:'Feed personalizado' },
    { key:'trending', label:'Em alta',            icon:'trending', hint:'Os mais lidos da semana' },
    { key:'genres',   label:'Gêneros',            icon:'compass',  hint:'Shounen, Seinen, Isekai…' },
    { key:'new',      label:'Lançamentos',        icon:'sparkle',  hint:'Adicionados recentemente' },
  ]},
  { title:'Comunidade', items:[
    { key:'forum',    label:'Fórum',              icon:'forum',    hint:'Discussões por obra' },
    { key:'groups',   label:'Grupos de scan',     icon:'groups',   hint:'Traduções e equipes' },
    { key:'events',   label:'Eventos',            icon:'calendar', hint:'Lives, leituras conjuntas' },
  ]},
  { title:'Atualizações', items:[
    { key:'news',     label:'Novidades',          icon:'news',     hint:'App + mundo dos mangás' },
    { key:'settings', label:'Configurações',      icon:'settings', hint:'Defaults globais da plataforma' },
    { key:'help',     label:'Central de ajuda',   icon:'help',     hint:'FAQ, status e falar com o time' },
  ]},
];
