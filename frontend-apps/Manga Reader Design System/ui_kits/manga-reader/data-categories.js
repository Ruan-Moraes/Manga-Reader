// data-categories.js — extra metadata for the Categories page filters

// Tag pool — every manga gets a few from here
window.ALL_TAGS = [
  'Ação','Aventura','Comédia','Drama','Romance','Sobrenatural','Mistério',
  'Fantasia','Sci-fi','Horror','Slice of Life','Esportes','Psicológico',
  'Histórico','Mecha','Magia','Sobrevivência','Vampiros','Demônios',
  'Política','Cyberpunk','Pós-apocalíptico','Tragédia','Yakuza',
  'Reencarnação','Sistema','Lutas','Militar','Escolar','Culinária',
  'Vingança','Amizade','Coming of Age','Filosófico','Viagem no tempo',
];

window.STATUS_OPTIONS = [
  { key:'andamento', label:'Em andamento', tone:'#ddda2a' },
  { key:'completo',  label:'Completo',     tone:'#1f3a2a' },
  { key:'hiato',     label:'Em hiato',     tone:'#FF784F' },
  { key:'abandonado',label:'Abandonado',   tone:'#727273' },
];

window.SORT_OPTIONS = [
  { key:'popular',    label:'Mais lidos',     icon:'eye' },
  { key:'rising',     label:'Em ascensão',    icon:'sparkle' },
  { key:'rated',      label:'Mais votados',   icon:'star' },
  { key:'recent',     label:'Mais recentes',  icon:'clock' },
  { key:'updated',    label:'Atualizados',    icon:'refresh' },
  { key:'alpha',      label:'A → Z',          icon:'az' },
  { key:'alpha-desc', label:'Z → A',          icon:'za' },
  { key:'random',     label:'Aleatórios',     icon:'shuffle' },
];

// Enrich each manga with tags, adult flag, view counts, and a normalized status key.
// Done outside data.js so we don't touch the original.
(function enrich(){
  if (!window.MANGAS) return;
  const tagSets = {
    op: ['Aventura','Ação','Amizade','Comédia','Histórico'],
    bk: ['Fantasia','Horror','Tragédia','Vingança','Demônios','Psicológico'],
    sl: ['Ação','Sistema','Reencarnação','Lutas','Sobrevivência'],
    jk: ['Sobrenatural','Lutas','Demônios','Escolar','Drama'],
    cs: ['Demônios','Ação','Tragédia','Romance','Drama','Coming of Age'],
    fr: ['Fantasia','Magia','Aventura','Slice of Life','Filosófico'],
    vm: ['Histórico','Drama','Tragédia','Coming of Age','Militar'],
    mt: ['Reencarnação','Fantasia','Magia','Aventura','Romance'],
    dg: ['Sobrenatural','Comédia','Romance','Lutas','Mistério'],
    ks: ['Ação','Sci-fi','Militar','Sobrevivência'],
  };
  const adult = new Set(['bk','cs','vm']);
  window.MANGAS.forEach((m, i) => {
    m.tags = tagSets[m.id] || ['Aventura','Ação'];
    m.adult = adult.has(m.id);
    m.statusKey = (m.status||'').toLowerCase().includes('andamento') ? 'andamento'
                : (m.status||'').toLowerCase().includes('completo')  ? 'completo'
                : (m.status||'').toLowerCase().includes('hiato')     ? 'hiato'
                : 'abandonado';
    m.views = 12000 - i*900 + (m.rating*1000)|0;
    m.rising = (i % 3 === 0) ? 0.95 - i*0.02 : 0.4 - i*0.01;
    m.updatedHrs = (i*7) % 96;
  });
  // Stamp 2 entries as hiato/abandonado for variety
  if (window.MANGAS[7]) window.MANGAS[7].statusKey = 'hiato';
  if (window.MANGAS[9]) window.MANGAS[9].statusKey = 'abandonado';
})();
