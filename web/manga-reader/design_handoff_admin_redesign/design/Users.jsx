// Users.jsx — tela Usuários (lista + detalhe/alterar role/banir/excluir via modal)

const ROLE_VARIANT = { 'Admin': 'danger', 'Moderador': 'accent', 'Membro': 'neutral' };
const ROLE_OPTS = ['Membro', 'Moderador', 'Admin'];

function RoleBadge({ role }) {
  return <Badge variant={ROLE_VARIANT[role] || 'neutral'}>{role}</Badge>;
}
function UserStatus({ status }) {
  return <StatusPill tone={status === 'Banido' ? 'ended' : 'live'}>{status}</StatusPill>;
}

function Users({ go }) {
  const [users, setUsers] = React.useState(() => window.ADMIN_USERS.map((u) => ({ ...u })));
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [sel, setSel] = React.useState(null);
  const [modal, setModal] = React.useState(null); // 'detail' | 'role' | 'ban' | 'delete'
  const [roleDraft, setRoleDraft] = React.useState('Membro');
  const [banReason, setBanReason] = React.useState('');

  const filtered = users.filter((u) => {
    if (!applied) return true;
    const q = applied.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const open = (u, m) => { setSel(u); setRoleDraft(u.role); setBanReason(''); setModal(m); };
  const close = () => setModal(null);

  const applyRole = () => { setUsers((us) => us.map((u) => u.id === sel.id ? { ...u, role: roleDraft } : u)); close(); };
  const toggleBan = () => {
    setUsers((us) => us.map((u) => u.id === sel.id ? { ...u, status: u.status === 'Banido' ? 'Ativo' : 'Banido' } : u));
    close();
  };
  const doDelete = () => { setUsers((us) => us.filter((u) => u.id !== sel.id)); close(); };

  const columns = [
    { header: 'ID', width: 96, hideBelow: 'md', render: (u) => <code className="adm-mono">{u.id}</code> },
    { header: 'Nome', render: (u) => (
      <div className="adm-cell-user">
        <Avatar initials={u.initials} color={u.color} size={32} />
        <span style={{ fontWeight: 700 }}>{u.name}</span>
      </div>
    )},
    { header: 'Email', hideBelow: 'sm', render: (u) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{u.email}</span> },
    { header: 'Role', render: (u) => <RoleBadge role={u.role} /> },
    { header: 'Status', render: (u) => <UserStatus status={u.status} /> },
    { header: 'Cadastro', hideBelow: 'md', render: (u) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{u.created}</span> },
    { header: 'Ações', align: 'right', width: 96, render: (u) => (
      <div className="adm-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" title="Detalhes / editar" onClick={() => open(u, 'detail')} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => open(u, 'delete')} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Usuários</h1>
          <p className="adm-page-sub">{filtered.length} {filtered.length === 1 ? 'usuário' : 'usuários'} na comunidade.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        state={state}
        onRetry={() => setState('data')}
        search={query}
        onSearch={setQuery}
        onSubmitSearch={() => { setApplied(query); setPage(1); }}
        searchPlaceholder="Buscar por nome ou email..."
        toolbarRight={<StateSwitcher value={state} onChange={setState} />}
        emptyTitle="Nenhum usuário encontrado"
        emptyMsg={applied ? `Nada corresponde a “${applied}”. Tente outro termo.` : 'Ainda não há usuários cadastrados.'}
        onRowClick={(u) => open(u, 'detail')}
        page={page} perPage={8} onPage={setPage}
      />

      {/* Detalhe do usuário */}
      <Modal open={modal === 'detail'} onClose={close} title="Detalhes do usuário" size="md"
        footer={sel && (
          <>
            <Button variant="ghost" size="sm" icon="award" onClick={() => setModal('role')}>Alterar role</Button>
            <Button variant="ghost" size="sm" danger icon={sel.status === 'Banido' ? 'refresh' : 'alert'} onClick={() => setModal('ban')}>
              {sel.status === 'Banido' ? 'Desbanir' : 'Banir'}
            </Button>
          </>
        )}>
        {sel && (
          <div>
            <div className="adm-user-head">
              <Avatar initials={sel.initials} color={sel.color} size={56} />
              <div style={{ minWidth: 0 }}>
                <div className="adm-user-head-name">{sel.name}</div>
                <div className="adm-user-head-mail">{sel.email}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <RoleBadge role={sel.role} />
                  <UserStatus status={sel.status} />
                </div>
              </div>
            </div>
            <div className="adm-info-list">
              <div><span>ID</span><code className="adm-mono">{sel.id}</code></div>
              <div><span>Cadastro</span><b>{sel.created}, 06:54</b></div>
              <div><span>Atualizado</span><b>{sel.created}, 06:54</b></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Alterar role */}
      <Modal open={modal === 'role'} onClose={close} title="Alterar role" size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={close}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={applyRole}>Salvar</Button>
          </>
        }>
        {sel && (
          <Field label="Role do usuário" hint="Define o nível de acesso na plataforma.">
            <SelectInput value={roleDraft} onChange={setRoleDraft} options={ROLE_OPTS} />
          </Field>
        )}
      </Modal>

      {/* Banir / desbanir */}
      {sel && sel.status !== 'Banido' ? (
        <Modal open={modal === 'ban'} onClose={close} title="Banir usuário" size="sm" danger
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={close}>Cancelar</Button>
              <Button variant="ghost" size="sm" danger onClick={toggleBan}>Banir</Button>
            </>
          }>
          <p style={{ margin: '0 0 14px', color: 'var(--mr-fg-muted)', fontSize: 14, lineHeight: 1.6 }}>
            <b style={{ color: 'var(--mr-fg)' }}>{sel.name}</b> perderá acesso imediatamente. Você pode reverter depois.
          </p>
          <Field label="Motivo (opcional)">
            <Textarea value={banReason} onChange={setBanReason} rows={3} placeholder="Ex.: violação das diretrizes da comunidade." />
          </Field>
        </Modal>
      ) : (
        <ConfirmModal open={modal === 'ban'} onClose={close} onConfirm={toggleBan}
          title="Desbanir usuário" danger={false} confirmLabel="Desbanir"
          message={sel ? <><b style={{ color: 'var(--mr-fg)' }}>{sel.name}</b> voltará a ter acesso à plataforma.</> : ''} />
      )}

      {/* Excluir (digite o ID) */}
      <ConfirmModal open={modal === 'delete'} onClose={close} onConfirm={doDelete}
        title="Excluir usuário" confirmLabel="Excluir" confirmWord={sel && sel.id}
        message={sel ? <>Esta ação é irreversível. A conta de <b style={{ color: 'var(--mr-fg)' }}>{sel.name}</b> será removida permanentemente.</> : ''} />
    </div>
  );
}

Object.assign(window, { Users });
