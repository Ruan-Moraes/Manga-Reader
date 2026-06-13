// News.jsx — tela Notícias (lista + criar/editar via modal de form localizado + excluir)

function NewsFormModal({ open, onClose, onSave, onDelete, draft, setDraft }) {
  if (!open) return null;
  const isEdit = draft.id != null;
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={isEdit ? 'Editar notícia' : 'Nova notícia'}
      subtitle="Campos com idioma podem ser preenchidos em pt-BR, en-US e es-ES."
      footer={
        <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>{isEdit && <Button variant="ghost" size="sm" danger icon="trash" onClick={onDelete}>Excluir</Button>}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={onSave}>Salvar</Button>
          </div>
        </div>
      }>
      <LocalizedField label="Título" required value={draft.title} onChange={(v) => set('title', v)} placeholder="Título da notícia" />
      <Field label="Categoria" required>
        <SelectInput value={draft.category} onChange={(v) => set('category', v)} options={window.NEWS_CATEGORIES} placeholder="Selecione a categoria" />
      </Field>
      <LocalizedField label="Subtítulo" value={draft.subtitle} onChange={(v) => set('subtitle', v)} placeholder="Linha de apoio" />
      <LocalizedField label="Resumo" multiline rows={3} value={draft.summary} onChange={(v) => set('summary', v)} placeholder="Resumo da matéria" />
      <div className="adm-form-grid-2">
        <Field label="Cover URL"><TextInput value={draft.cover} onChange={(v) => set('cover', v)} placeholder="https://..." /></Field>
        <Field label="Fonte"><TextInput value={draft.source} onChange={(v) => set('source', v)} /></Field>
      </div>
      <div className="adm-form-grid-2">
        <Field label="Autor"><TextInput value={draft.author} onChange={(v) => set('author', v)} /></Field>
        <Field label="Tempo de leitura (min)"><TextInput type="number" value={draft.readTime} onChange={(v) => set('readTime', v)} /></Field>
      </div>
      <Field label="Tags" hint="Separadas por vírgula."><TextInput value={draft.tags} onChange={(v) => set('tags', v)} placeholder="Mangá, Lançamento" /></Field>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 4 }}>
        <Toggle checked={draft.exclusive} onChange={(v) => set('exclusive', v)} label="Exclusiva" />
        <Toggle checked={draft.featured} onChange={(v) => set('featured', v)} label="Destaque" />
      </div>
    </Modal>
  );
}

function emptyNews() {
  return { id: null, title: { 'pt-BR': '', 'en-US': '', 'es-ES': '' }, category: '', subtitle: { 'pt-BR': '', 'en-US': '', 'es-ES': '' }, summary: { 'pt-BR': '', 'en-US': '', 'es-ES': '' }, cover: '', source: '', author: 'Redação MangaReader', readTime: 4, tags: '', exclusive: false, featured: false };
}
function newsToDraft(n) {
  return { ...n, title: { 'pt-BR': n.title, 'en-US': '', 'es-ES': '' }, subtitle: n.subtitle, summary: n.summary };
}

function News({ go }) {
  const [news, setNews] = React.useState(() => window.ADMIN_NEWS.map((n) => ({ ...n })));
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [form, setForm] = React.useState(false);
  const [draft, setDraft] = React.useState(emptyNews());
  const [del, setDel] = React.useState(null);

  const filtered = news.filter((n) => !applied || n.title.toLowerCase().includes(applied.toLowerCase()));

  const openNew = () => { setDraft(emptyNews()); setForm(true); };
  const openEdit = (n) => { setDraft(newsToDraft(n)); setForm(true); };
  const save = () => {
    const title = (draft.title['pt-BR'] || '').trim() || 'Sem título';
    if (draft.id != null) setNews((ns) => ns.map((n) => n.id === draft.id ? { ...n, ...draft, title } : n));
    else setNews((ns) => [{ ...draft, id: 'news-' + (ns.length + 1), title, views: 0, published: '13/06/2026' }, ...ns]);
    setForm(false);
  };
  const confirmDelete = () => { setNews((ns) => ns.filter((n) => n.id !== del.id)); setDel(null); setForm(false); };

  const columns = [
    { header: 'ID', width: 76, hideBelow: 'md', render: (n) => <span className="adm-mono">{n.id}</span> },
    { header: 'Título', render: (n) => <span style={{ fontWeight: 700, display: 'block', maxWidth: 460 }}>{n.title}</span> },
    { header: 'Categoria', hideBelow: 'sm', render: (n) => <Badge variant="neutral">{n.category}</Badge> },
    { header: 'Views', hideBelow: 'md', align: 'right', width: 90, render: (n) => <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--mr-fg-subtle)' }}>{n.views.toLocaleString('pt-BR')}</span> },
    { header: 'Destaque', align: 'right', width: 90, render: (n) => n.featured ? <Badge variant="accent">Sim</Badge> : <Badge variant="neutral">Não</Badge> },
    { header: 'Ações', align: 'right', width: 96, render: (n) => (
      <div className="adm-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" title="Editar" onClick={() => openEdit(n)} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => setDel(n)} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Notícias</h1>
          <p className="adm-page-sub">{filtered.length} {filtered.length === 1 ? 'notícia' : 'notícias'} publicadas.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nova notícia</Button>
      </div>

      <DataTable
        columns={columns} rows={filtered} state={state} onRetry={() => setState('data')}
        search={query} onSearch={setQuery} onSubmitSearch={() => { setApplied(query); setPage(1); }}
        searchPlaceholder="Buscar por título..."
        toolbarRight={<StateSwitcher value={state} onChange={setState} />}
        emptyTitle="Nenhuma notícia encontrada" emptyMsg={applied ? `Nada corresponde a “${applied}”.` : 'Publique a primeira notícia.'}
        onRowClick={openEdit} page={page} perPage={8} onPage={setPage}
      />

      <NewsFormModal open={form} onClose={() => setForm(false)} onSave={save}
        onDelete={() => setDel(news.find((n) => n.id === draft.id))} draft={draft} setDraft={setDraft} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
        title="Excluir notícia" confirmLabel="Excluir" confirmWord={del && del.id}
        message={del ? <>Esta ação é irreversível. A notícia <b style={{ color: 'var(--mr-fg)' }}>{del.id}</b> será removida permanentemente.</> : ''} />
    </div>
  );
}

Object.assign(window, { News });
