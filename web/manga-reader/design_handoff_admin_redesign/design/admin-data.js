// admin-data.js — dados fake da área administrativa Manga Reader
// Espelham os dados das telas atuais (Visão geral, listas, etc).

// ---------- KPIs da Visão geral ----------
window.ADMIN_KPIS = [
  { id: 'users',  icon: 'users',     label: 'Usuários',  value: 10, route: 'users'  },
  { id: 'titles', icon: 'book',      label: 'Obras',     value: 10, route: 'titles' },
  { id: 'groups', icon: 'layers',    label: 'Grupos',    value: 10, route: 'groups' },
  { id: 'news',   icon: 'news',      label: 'Notícias',  value: 10, route: 'news'   },
  { id: 'events', icon: 'calendar',  label: 'Eventos',   value: 10, route: 'events' },
  { id: 'banned', icon: 'alert',     label: 'Banidos',   value: 2,  tone: 'danger'  },
];

// ---------- Distribuição por role ----------
window.ADMIN_ROLES = [
  { role: 'Admin',     count: 1, tone: 'admin'  },
  { role: 'Moderador', count: 2, tone: 'mod'    },
  { role: 'Membro',    count: 7, tone: 'member' },
];

// ---------- Obras por status ----------
window.ADMIN_TITLES_STATUS = {
  total: 10,
  rows: [
    { key: 'ongoing',   label: 'Em andamento', count: 5, tone: 'live'    },
    { key: 'completed', label: 'Concluído',    count: 2, tone: 'open'    },
    { key: 'hiatus',    label: 'Hiato',        count: 2, tone: 'soon'    },
    { key: 'cancelled', label: 'Cancelado',    count: 1, tone: 'ended'   },
  ],
};

// ---------- Eventos por status ----------
window.ADMIN_EVENTS_STATUS = {
  total: 10,
  rows: [
    { key: 'happening',  label: 'Acontecendo agora', count: 2, tone: 'live'  },
    { key: 'open',       label: 'Inscrições abertas', count: 3, tone: 'open'  },
    { key: 'soon',       label: 'Em breve',           count: 2, tone: 'soon'  },
    { key: 'ended',      label: 'Encerrado',          count: 3, tone: 'ended' },
  ],
};

// ---------- Top 10 obras por ranking ----------
window.ADMIN_RANKING = [
  { rank: 1,  title: 'Flores de Neon',        type: 'Mangá',  rating: 2.7, votes: 4  },
  { rank: 2,  title: 'Vento Cortante',        type: 'Manhwa', rating: 2.6, votes: 10 },
  { rank: 3,  title: 'Guardião Celestial',    type: 'Manhua', rating: 2.6, votes: 9  },
  { rank: 4,  title: 'Reino de Aço',          type: 'Mangá',  rating: 2.6, votes: 7  },
  { rank: 5,  title: 'Protocolo Zero',        type: 'Manhwa', rating: 2.6, votes: 7  },
  { rank: 6,  title: 'Crônicas de Polaris',   type: 'Mangá',  rating: 2.6, votes: 3  },
  { rank: 7,  title: 'Coração de Porcelana',  type: 'Mangá',  rating: 2.5, votes: 8  },
  { rank: 8,  title: 'Lâmina do Amanhã',      type: 'Manhwa', rating: 2.4, votes: 6  },
  { rank: 9,  title: 'Noites Vermelhas',      type: 'Mangá',  rating: 2.3, votes: 5  },
  { rank: 10, title: 'Espelho do Vazio',      type: 'Manhua', rating: 2.2, votes: 2  },
];

// ---------- Tendência mensal (sparkline da Visão geral) ----------
window.ADMIN_TREND = {
  newUsers:  { label: 'Novos usuários (30d)', value: 4,  delta: +33,  series: [2,3,2,4,3,5,4,6,5,7,6,8] },
  newTitles: { label: 'Obras adicionadas (30d)', value: 2, delta: +12, series: [1,1,2,1,2,2,1,3,2,2,3,3] },
};

// ---------- Sessão atual ----------
window.ADMIN_SESSION = {
  name: 'Ana Beatriz',
  email: 'admin@mangareader.com',
  role: 'Admin',
  shortId: '113cdeb4',
  initials: 'AB',
  color: '#ddda2a',
};
