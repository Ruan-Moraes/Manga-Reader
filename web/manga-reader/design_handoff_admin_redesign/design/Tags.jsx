// Tags.jsx — tela Tags (lista + criar/editar via modal simples localizado + excluir por ID)

function TagFormModal({ open, onClose, onSave, draft, setDraft }) {
  if (!open) return null;
  const isEdit = draft.id != null;
  const valid = (draft.name['pt-BR'] || '').trim().length > 0;
  return (
    <Modal open={open} onClose={onClose} size="sm"
      title={isEdit ? 'Editar tag' : 'Nova tag'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => valid && onSave()}>
            <span style={{ opacity: valid ? 1 : 0.45 }}>Salvar</span>
          </Button>
        </>
      }>
      <LocalizedField label="Nome da tag" required value={draft.name}
        onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Ex.: Aventura" />
    </Modal>
  );
}

function Tags({ go }) {
  const [tags, setTags] = React.useState(() => window.ADMIN_TAGS.map((t) => ({ ...t })));
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [form, setForm] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const [del, setDel] = React.useState(null);

  const filtered = tags
    .filter((t) => !applied || t.name.toLowerCase().includes(applied.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const openNew = () => { setDraft({ id: null, name: { 'pt-BR': '', 'en-US': '', 'es-ES': '' } }); setForm(true); };
  const openEdit = (t) => { setDraft({ id: t.id, name: { 'pt-BR': t.name, 'en-US': '', 'es-ES': '' } }); setForm(true); };

  const save = () => {
    const name = draft.name['pt-BR'].trim();
    if (draft.id != null) setTags((ts) => ts.map((t) => t.id === draft.id ? { ...t, name } : t));
    else setTags((ts) => [...ts, { id: Math.max(0, ...tags.map((t) => t.id)) + 1, name }]);
    setForm(false);
  };
  const confirmDelete = () => { setTags((ts) => ts.filter((t) => t.id !== del.id)); setDel(null); };

  const columns = [
    { header: 'ID', width: 72, render: (t) => <span className="adm-mono">{t.id}</span> },
    { header: 'Nome', render: (t) => <span style={{ fontWeight: 700 }}>{t.name}</span> },
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
          <h1 className="adm-page-title">Tags</h1>
          <p className="adm-page-sub">{filtered.length} {filtered.length === 1 ? 'tag' : 'tags'} de gênero.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nova tag</Button>
      </div>

      <DataTable
        columns={columns} rows={filtered} state={state}
        onRetry={() => setState('data')}
        search={query} onSearch={setQuery}
        onSubmitSearch={() => { setApplied(query); setPage(1); }}
        searchPlaceholder="Buscar tags..."
        toolbarRight={<StateSwitcher value={state} onChange={setState} />}
        emptyTitle="Nenhuma tag encontrada"
        emptyMsg={applied ? `Nada corresponde a “${applied}”.` : 'Crie a primeira tag de gênero.'}
        onRowClick={openEdit}
        page={page} perPage={12} onPage={setPage}
      />

      {draft && <TagFormModal open={form} onClose={() => setForm(false)} onSave={save} draft={draft} setDraft={setDraft} />}

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
        title="Excluir tag" confirmLabel="Excluir" confirmWord={del && del.id}
        message={del ? <>Tem certeza que deseja excluir a tag <b style={{ color: 'var(--mr-fg)' }}>{del.name}</b>? Esta ação é irreversível.</> : ''} />
    </div>
  );
}

Object.assign(window, { Tags });
