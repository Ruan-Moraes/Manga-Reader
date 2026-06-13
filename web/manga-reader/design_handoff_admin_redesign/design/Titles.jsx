// Titles.jsx — tela Títulos (lista + criar/editar via modal de formulário longo localizado)

function TitleStatus({ status }) {
  return <StatusPill tone={window.TITLE_STATUS_TONE[status] || 'soon'}>{status}</StatusPill>;
}

function emptyDraft() {
  return {
    id: null,
    name: { 'pt-BR': '', 'en-US': '', 'es-ES': '' },
    type: '', status: '',
    synopsis: { 'pt-BR': '', 'en-US': '', 'es-ES': '' },
    cover: '', genres: '', author: '', artist: '', publisher: '', adult: false,
  };
}
function toDraft(t) {
  return {
    id: t.id,
    name: { 'pt-BR': t.name, 'en-US': '', 'es-ES': '' },
    type: t.type, status: t.status,
    synopsis: t.synopsis || { 'pt-BR': '', 'en-US': '', 'es-ES': '' },
    cover: t.cover || '', genres: t.genres || '', author: t.author || '', artist: t.artist || '', publisher: t.publisher || '', adult: !!t.adult,
  };
}

function TitleFormModal({ open, onClose, onSave, onDelete, draft, setDraft }) {
  if (!open) return null;
  const isEdit = draft.id != null;
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={isEdit ? 'Editar título' : 'Novo título'}
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
      <LocalizedField label="Nome" required value={draft.name} onChange={(v) => set('name', v)} placeholder="Nome da obra" />
      <Field label="Tipo">
        <SelectInput value={draft.type} onChange={(v) => set('type', v)} options={window.TITLE_TYPES} placeholder="Selecione o tipo" />
      </Field>
      <LocalizedField label="Sinopse" multiline rows={3} value={draft.synopsis} onChange={(v) => set('synopsis', v)} placeholder="Breve descrição da obra" />
      <div className="adm-form-grid-2">
        <Field label="Cover URL"><TextInput value={draft.cover} onChange={(v) => set('cover', v)} placeholder="https://..." /></Field>
        <Field label="Status"><SelectInput value={draft.status} onChange={(v) => set('status', v)} options={window.TITLE_STATUSES} placeholder="Selecione o status" /></Field>
      </div>
      <Field label="Gêneros" hint="Separados por vírgula.">
        <TextInput value={draft.genres} onChange={(v) => set('genres', v)} placeholder="Ação, Aventura, Fantasia" />
      </Field>
      <div className="adm-form-grid-3">
        <Field label="Autor"><TextInput value={draft.author} onChange={(v) => set('author', v)} /></Field>
        <Field label="Artista"><TextInput value={draft.artist} onChange={(v) => set('artist', v)} /></Field>
        <Field label="Editora"><TextInput value={draft.publisher} onChange={(v) => set('publisher', v)} /></Field>
      </div>
      <Toggle checked={draft.adult} onChange={(v) => set('adult', v)} label="Conteúdo adulto" />
    </Modal>
  );
}

function Titles({ go }) {
  const [titles, setTitles] = React.useState(() => window.ADMIN_TITLES.map((t) => ({ ...t })));
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [form, setForm] = React.useState(false);
  const [draft, setDraft] = React.useState(emptyDraft());
  const [del, setDel] = React.useState(null);

  const filtered = titles.filter((t) => !applied || t.name.toLowerCase().includes(applied.toLowerCase()));

  const openNew = () => { setDraft(emptyDraft()); setForm(true); };
  const openEdit = (t) => { setDraft(toDraft(t)); setForm(true); };

  const save = () => {
    const name = (draft.name['pt-BR'] || '').trim() || 'Sem título';
    if (draft.id != null) {
      setTitles((ts) => ts.map((t) => t.id === draft.id ? { ...t, name, type: draft.type, status: draft.status, synopsis: draft.synopsis, cover: draft.cover, genres: draft.genres, author: draft.author, artist: draft.artist, publisher: draft.publisher, adult: draft.adult } : t));
    } else {
      const id = Math.max(0, ...titles.map((t) => t.id)) + 1;
      setTitles((ts) => [{ id, name, type: draft.type || 'Mangá', status: draft.status || 'Em andamento', chapters: 0, created: '13/06/2026', ...draft, id }, ...ts]);
    }
    setForm(false);
  };
  const confirmDelete = () => { setTitles((ts) => ts.filter((t) => t.id !== del.id)); setDel(null); setForm(false); };

  const columns = [
    { header: 'ID', width: 56, render: (t) => <span className="adm-mono">{t.id}</span> },
    { header: 'Nome', render: (t) => <span style={{ fontWeight: 700 }}>{t.name}</span> },
    { header: 'Tipo', hideBelow: 'sm', render: (t) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{t.type}</span> },
    { header: 'Status', render: (t) => <TitleStatus status={t.status} /> },
    { header: 'Capítulos', hideBelow: 'md', align: 'right', width: 90, render: (t) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t.chapters}</span> },
    { header: 'Criado em', hideBelow: 'md', render: (t) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{t.created}</span> },
    { header: 'Ações', align: 'right', width: 96, render: (t) => (
      <div className="adm-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" title="Editar" onClick={() => openEdit(t)} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => setDel(t)} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Títulos</h1>
          <p className="adm-page-sub">{filtered.length} {filtered.length === 1 ? 'obra' : 'obras'} no catálogo.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Novo título</Button>
      </div>

      <DataTable
        columns={columns} rows={filtered} state={state}
        onRetry={() => setState('data')}
        search={query} onSearch={setQuery}
        onSubmitSearch={() => { setApplied(query); setPage(1); }}
        searchPlaceholder="Buscar por nome..."
        toolbarRight={<StateSwitcher value={state} onChange={setState} />}
        emptyTitle="Nenhuma obra encontrada"
        emptyMsg={applied ? `Nada corresponde a “${applied}”.` : 'Comece adicionando um novo título.'}
        onRowClick={openEdit}
        page={page} perPage={8} onPage={setPage}
      />

      <TitleFormModal open={form} onClose={() => setForm(false)} onSave={save}
        onDelete={() => setDel(titles.find((t) => t.id === draft.id))}
        draft={draft} setDraft={setDraft} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
        title="Excluir título" confirmLabel="Excluir" confirmWord={del && del.id}
        message={del ? <>Esta ação é irreversível. A obra <b style={{ color: 'var(--mr-fg)' }}>{del.name}</b> será removida permanentemente.</> : ''} />
    </div>
  );
}

Object.assign(window, { Titles });
