// Groups.jsx — tela Grupos (lista + detalhe + editar + alterar função de membro, tudo via modal)

function GroupStatus({ status }) {
  return <StatusPill tone={window.GROUP_STATUS_TONE[status] || 'soon'}>{status}</StatusPill>;
}
function groupInitials(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}
function RoleTag({ role }) {
  return <Badge variant={role === 'Líder' ? 'accent' : 'neutral'}>{role}</Badge>;
}

function Groups({ go }) {
  const [groups, setGroups] = React.useState(() => window.ADMIN_GROUPS.map((g) => ({ ...g, members: g.members.map((m) => ({ ...m })) })));
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [selId, setSelId] = React.useState(null);
  const [modal, setModal] = React.useState(null); // 'detail' | 'form' | 'delete' | 'memberRole'
  const [draft, setDraft] = React.useState(null);
  const [memberDraft, setMemberDraft] = React.useState(null); // { index, role }

  const sel = groups.find((g) => g.id === selId) || null;
  const filtered = groups.filter((g) => !applied || g.name.toLowerCase().includes(applied.toLowerCase()) || g.username.toLowerCase().includes(applied.toLowerCase()));

  const openDetail = (g) => { setSelId(g.id); setModal('detail'); };
  const openEdit = () => { setDraft({ name: sel.name, username: sel.username, status: sel.status, description: sel.description }); setModal('form'); };
  const saveEdit = () => {
    setGroups((gs) => gs.map((g) => g.id === selId ? { ...g, ...draft } : g));
    setModal('detail');
  };
  const confirmDelete = () => { setGroups((gs) => gs.filter((g) => g.id !== selId)); setModal(null); setSelId(null); };
  const openMemberRole = (idx) => { setMemberDraft({ index: idx, role: sel.members[idx].role }); setModal('memberRole'); };
  const saveMemberRole = () => {
    setGroups((gs) => gs.map((g) => g.id === selId
      ? { ...g, members: g.members.map((mm, i) => i === memberDraft.index ? { ...mm, role: memberDraft.role } : mm) } : g));
    setModal('detail');
  };

  const columns = [
    { header: 'ID', width: 96, hideBelow: 'md', render: (g) => <span className="adm-mono">{g.id}</span> },
    { header: 'Nome', render: (g) => (
      <div className="adm-cell-user">
        <Avatar initials={groupInitials(g.name)} color="#ddda2a" size={32} />
        <span style={{ fontWeight: 700 }}>{g.name}</span>
      </div>
    )},
    { header: 'Username', hideBelow: 'sm', render: (g) => <span className="adm-mono" style={{ color: 'var(--mr-accent)' }}>{g.username}</span> },
    { header: 'Status', render: (g) => <GroupStatus status={g.status} /> },
    { header: 'Membros', hideBelow: 'md', align: 'right', width: 84, render: (g) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{g.members.length}</span> },
    { header: 'Títulos', hideBelow: 'md', align: 'right', width: 78, render: (g) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{g.titles}</span> },
    { header: 'Entrada', hideBelow: 'md', render: (g) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{g.entrada}</span> },
    { header: 'Ações', align: 'right', width: 96, render: (g) => (
      <div className="adm-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" title="Detalhes" onClick={() => openDetail(g)} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => { setSelId(g.id); setModal('delete'); }} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Grupos</h1>
          <p className="adm-page-sub">{filtered.length} {filtered.length === 1 ? 'grupo' : 'grupos'} de tradução.</p>
        </div>
      </div>

      <DataTable
        columns={columns} rows={filtered} state={state}
        onRetry={() => setState('data')}
        search={query} onSearch={setQuery}
        onSubmitSearch={() => { setApplied(query); setPage(1); }}
        searchPlaceholder="Buscar por nome..."
        toolbarRight={<StateSwitcher value={state} onChange={setState} />}
        emptyTitle="Nenhum grupo encontrado"
        emptyMsg={applied ? `Nada corresponde a “${applied}”.` : 'Ainda não há grupos cadastrados.'}
        onRowClick={openDetail}
        page={page} perPage={8} onPage={setPage}
      />

      {/* Detalhe do grupo */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} size="lg" title="Detalhes do grupo"
        footer={sel && (
          <>
            <Button variant="ghost" size="sm" danger icon="trash" onClick={() => setModal('delete')}>Excluir</Button>
            <Button variant="primary" size="sm" icon="edit" onClick={openEdit}>Editar</Button>
          </>
        )}>
        {sel && (
          <div>
            <div className="adm-user-head">
              <Avatar initials={groupInitials(sel.name)} color="#ddda2a" size={56} />
              <div style={{ minWidth: 0 }}>
                <div className="adm-user-head-name">{sel.name}</div>
                <div className="adm-mono" style={{ color: 'var(--mr-accent)', fontSize: 13 }}>{sel.username}</div>
                <div style={{ marginTop: 8 }}><GroupStatus status={sel.status} /></div>
              </div>
            </div>

            <div className="adm-form-grid-2" style={{ gap: '0 32px' }}>
              <div className="adm-info-list">
                <div><span>ID</span><code className="adm-mono">{sel.id}</code></div>
                <div><span>Membros</span><b>{sel.members.length}</b></div>
                <div><span>Títulos</span><b>{sel.titles}</b></div>
              </div>
              <div className="adm-info-list">
                <div><span>Rating</span><b>★ {sel.rating.toFixed(1)}</b></div>
                <div><span>Popularidade</span><b>{sel.popularity}</b></div>
                <div><span>Entrada</span><b>{sel.entrada}</b></div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="adm-kpi-label" style={{ marginBottom: 6 }}>Descrição</div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--mr-fg-muted)', lineHeight: 1.6 }}>{sel.description || '—'}</p>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="adm-kpi-label" style={{ marginBottom: 10 }}>Membros ({sel.members.length})</div>
              {sel.members.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--mr-fg-subtle)' }}>Nenhum membro neste grupo.</p>
              ) : (
                <div className="adm-member-list">
                  {sel.members.map((mm, i) => (
                    <div className="adm-member" key={i}>
                      <Avatar initials={mm.initials} color={mm.color} size={32} />
                      <span style={{ fontWeight: 700, flex: 1, minWidth: 0 }}>{mm.name}</span>
                      <RoleTag role={mm.role} />
                      <IconButton icon="award" title="Alterar função" onClick={() => openMemberRole(i)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Editar grupo */}
      <Modal open={modal === 'form'} onClose={() => setModal('detail')} size="md" title="Editar grupo"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal('detail')}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={saveEdit}>Salvar</Button>
          </>
        }>
        {draft && (
          <div>
            <div className="adm-form-grid-2">
              <Field label="Nome" required><TextInput value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} /></Field>
              <Field label="Username"><TextInput value={draft.username} onChange={(v) => setDraft((d) => ({ ...d, username: v }))} /></Field>
            </div>
            <Field label="Status"><SelectInput value={draft.status} onChange={(v) => setDraft((d) => ({ ...d, status: v }))} options={window.GROUP_STATUSES} /></Field>
            <Field label="Descrição"><Textarea value={draft.description} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} rows={3} /></Field>
          </div>
        )}
      </Modal>

      {/* Alterar função de membro */}
      <Modal open={modal === 'memberRole'} onClose={() => setModal('detail')} size="sm" title="Alterar função"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal('detail')}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={saveMemberRole}>Salvar</Button>
          </>
        }>
        {memberDraft && sel && sel.members[memberDraft.index] && (
          <Field label={`Função de ${sel.members[memberDraft.index].name}`}>
            <SelectInput value={memberDraft.role} onChange={(v) => setMemberDraft((d) => ({ ...d, role: v }))} options={window.MEMBER_ROLES} />
          </Field>
        )}
      </Modal>

      {/* Excluir grupo */}
      <ConfirmModal open={modal === 'delete'} onClose={() => setModal(sel ? 'detail' : null)} onConfirm={confirmDelete}
        title="Excluir grupo" confirmLabel="Excluir" confirmWord={sel && sel.id}
        message={sel ? <>Esta ação é irreversível. O grupo <b style={{ color: 'var(--mr-fg)' }}>{sel.name}</b> será removido permanentemente.</> : ''} />
    </div>
  );
}

Object.assign(window, { Groups });
