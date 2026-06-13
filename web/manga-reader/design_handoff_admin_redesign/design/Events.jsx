// Events.jsx — tela Eventos (lista + criar/editar via modal de form localizado + excluir)

function EventStatus({ status }) {
  return <StatusPill tone={window.EVENT_STATUS_TONE[status] || 'soon'}>{status}</StatusPill>;
}

function EventFormModal({ open, onClose, onSave, onDelete, draft, setDraft }) {
  if (!open) return null;
  const isEdit = draft.id != null;
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={isEdit ? 'Editar evento' : 'Novo evento'}
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
      <LocalizedField label="Título" required value={draft.title} onChange={(v) => set('title', v)} placeholder="Título do evento" />
      <LocalizedField label="Subtítulo" value={draft.subtitle} onChange={(v) => set('subtitle', v)} placeholder="Linha de apoio" />
      <LocalizedField label="Descrição" multiline rows={3} value={draft.description} onChange={(v) => set('description', v)} placeholder="Descrição do evento" />
      <div className="adm-form-grid-2">
        <Field label="Data início" required><TextInput type="date" value={draft.startISO} onChange={(v) => set('startISO', v)} /></Field>
        <Field label="Data fim" required><TextInput type="date" value={draft.endISO} onChange={(v) => set('endISO', v)} /></Field>
      </div>
      <div className="adm-form-grid-3">
        <Field label="Timeline" required><SelectInput value={draft.timeline} onChange={(v) => set('timeline', v)} options={window.EVENT_TIMELINES} /></Field>
        <Field label="Status" required><SelectInput value={draft.status} onChange={(v) => set('status', v)} options={window.EVENT_STATUSES} /></Field>
        <Field label="Tipo" required><SelectInput value={draft.type} onChange={(v) => set('type', v)} options={window.EVENT_TYPES} /></Field>
      </div>
      <div className="adm-form-grid-2">
        <Field label="Local"><TextInput value={draft.local} onChange={(v) => set('local', v)} /></Field>
        <Field label="Cidade"><TextInput value={draft.city} onChange={(v) => set('city', v)} /></Field>
      </div>
      <div className="adm-form-grid-3">
        <Field label="Organizador"><TextInput value={draft.organizer} onChange={(v) => set('organizer', v)} /></Field>
        <Field label="Preço"><TextInput value={draft.price} onChange={(v) => set('price', v)} /></Field>
        <Field label="Imagem URL"><TextInput value={draft.image} onChange={(v) => set('image', v)} placeholder="https://..." /></Field>
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 4 }}>
        <Toggle checked={draft.online} onChange={(v) => set('online', v)} label="Online" />
        <Toggle checked={draft.featured} onChange={(v) => set('featured', v)} label="Destaque" />
      </div>
    </Modal>
  );
}

function emptyEvent() {
  return { id: null, title: { 'pt-BR': '', 'en-US': '', 'es-ES': '' }, subtitle: { 'pt-BR': '', 'en-US': '', 'es-ES': '' }, description: { 'pt-BR': '', 'en-US': '', 'es-ES': '' }, startISO: '', endISO: '', timeline: 'Próximos', status: 'Em breve', type: '', local: '', city: '', organizer: '', price: '', image: '', online: false, featured: false };
}
function eventToDraft(e) {
  return { ...e, title: { 'pt-BR': e.title, 'en-US': '', 'es-ES': '' }, subtitle: e.subtitle, description: e.description, startISO: '', endISO: '' };
}

function Events({ go }) {
  const [events, setEvents] = React.useState(() => window.ADMIN_EVENTS.map((e) => ({ ...e })));
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [form, setForm] = React.useState(false);
  const [draft, setDraft] = React.useState(emptyEvent());
  const [del, setDel] = React.useState(null);

  const filtered = events.filter((e) => !applied || e.title.toLowerCase().includes(applied.toLowerCase()));

  const openNew = () => { setDraft(emptyEvent()); setForm(true); };
  const openEdit = (e) => { setDraft(eventToDraft(e)); setForm(true); };
  const save = () => {
    const title = (draft.title['pt-BR'] || '').trim() || 'Sem título';
    if (draft.id != null) setEvents((es) => es.map((e) => e.id === draft.id ? { ...e, ...draft, title } : e));
    else setEvents((es) => [{ ...draft, id: Math.random().toString(16).slice(2, 10), title, start: '13/06/2026' }, ...es]);
    setForm(false);
  };
  const confirmDelete = () => { setEvents((es) => es.filter((e) => e.id !== del.id)); setDel(null); setForm(false); };

  const columns = [
    { header: 'ID', width: 96, hideBelow: 'md', render: (e) => <span className="adm-mono">{e.id}</span> },
    { header: 'Título', render: (e) => <span style={{ fontWeight: 700, display: 'block', maxWidth: 380 }}>{e.title}</span> },
    { header: 'Tipo', hideBelow: 'sm', render: (e) => <Badge variant="neutral">{e.type}</Badge> },
    { header: 'Status', render: (e) => <EventStatus status={e.status} /> },
    { header: 'Local', hideBelow: 'md', render: (e) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{e.city}</span> },
    { header: 'Início', hideBelow: 'sm', render: (e) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{e.start}</span> },
    { header: 'Ações', align: 'right', width: 96, render: (e) => (
      <div className="adm-actions" onClick={(ev) => ev.stopPropagation()}>
        <IconButton icon="edit" title="Editar" onClick={() => openEdit(e)} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => setDel(e)} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Eventos</h1>
          <p className="adm-page-sub">{filtered.length} {filtered.length === 1 ? 'evento' : 'eventos'} cadastrados.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Novo evento</Button>
      </div>

      <DataTable
        columns={columns} rows={filtered} state={state} onRetry={() => setState('data')}
        search={query} onSearch={setQuery} onSubmitSearch={() => { setApplied(query); setPage(1); }}
        searchPlaceholder="Buscar por título..."
        toolbarRight={<StateSwitcher value={state} onChange={setState} />}
        emptyTitle="Nenhum evento encontrado" emptyMsg={applied ? `Nada corresponde a “${applied}”.` : 'Crie o primeiro evento.'}
        onRowClick={openEdit} page={page} perPage={8} onPage={setPage}
      />

      <EventFormModal open={form} onClose={() => setForm(false)} onSave={save}
        onDelete={() => setDel(events.find((e) => e.id === draft.id))} draft={draft} setDraft={setDraft} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
        title="Excluir evento" confirmLabel="Excluir" confirmWord={del && del.id}
        message={del ? <>Esta ação é irreversível. O evento <b style={{ color: 'var(--mr-fg)' }}>{del.title}</b> será removido permanentemente.</> : ''} />
    </div>
  );
}

Object.assign(window, { Events });
