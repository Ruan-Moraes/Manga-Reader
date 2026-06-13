// Financial.jsx — tela Financeiro (KPIs + distribuição por status + receita mensal + pagamentos)

function PayStatus({ status }) {
  return <StatusPill tone={window.PAYMENT_STATUS_TONE[status] || 'soon'}>{window.PAYMENT_STATUS_LABEL[status] || status}</StatusPill>;
}

function FinStatusCard() {
  const rows = window.FINANCE_STATUS;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="adm-card">
      <div className="adm-card-head"><h3 className="adm-card-title">Distribuição por status</h3></div>
      <div className="adm-fin-dist-head">
        <span>Status</span><span>Quantidade</span><span>Valor total</span>
      </div>
      {rows.map((r) => (
        <div className="adm-fin-dist" key={r.key}>
          <span className="adm-dist-label"><span className="adm-dist-dot" style={{ background: window.TONE_FILL[r.tone] }} />{r.label}</span>
          <span className="adm-fin-num">{r.count}</span>
          <span className="adm-fin-num">{window.brl(r.total)}</span>
          <span className="adm-dist-bar"><span className="adm-dist-fill" style={{ width: (r.count / max * 100) + '%', background: window.TONE_FILL[r.tone] }} /></span>
        </div>
      ))}
    </div>
  );
}

function Financial({ go }) {
  const [payments, setPayments] = React.useState(() => window.FINANCE_PAYMENTS.map((p) => ({ ...p })));
  const [filter, setFilter] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [edit, setEdit] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const [statusDraft, setStatusDraft] = React.useState('');

  const filtered = payments.filter((p) => !filter || p.status === filter);

  const openEdit = (p) => { setEdit(p); setStatusDraft(p.status); };
  const saveStatus = () => { setPayments((ps) => ps.map((p) => p.id === edit.id ? { ...p, status: statusDraft } : p)); setEdit(null); };
  const confirmDelete = () => { setPayments((ps) => ps.filter((p) => p.id !== del.id)); setDel(null); };

  const statusOpts = [{ value: '', label: 'Todos' }, ...Object.keys(window.PAYMENT_STATUS_LABEL).map((k) => ({ value: k, label: window.PAYMENT_STATUS_LABEL[k] }))];

  const columns = [
    { header: 'ID', width: 96, hideBelow: 'md', render: (p) => <span className="adm-mono">{p.id}</span> },
    { header: 'Valor', render: (p) => <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{window.brl(p.amount)}</span> },
    { header: 'Status', render: (p) => <PayStatus status={p.status} /> },
    { header: 'Método', hideBelow: 'sm', render: (p) => <span className="adm-mono" style={{ color: 'var(--mr-fg-subtle)' }}>{p.method}</span> },
    { header: 'Referência', hideBelow: 'md', render: (p) => <span className="adm-mono" style={{ color: 'var(--mr-fg-subtle)' }}>{p.ref}</span> },
    { header: 'Criado em', hideBelow: 'md', render: (p) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{p.created}</span> },
    { header: 'Ações', align: 'right', width: 96, render: (p) => (
      <div className="adm-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" title="Atualizar status" onClick={() => openEdit(p)} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => setDel(p)} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Financeiro</h1>
          <p className="adm-page-sub">Pagamentos, receita e auditoria.</p>
        </div>
      </div>

      <div className="adm-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {window.FINANCE_KPIS.map((k, i) => (
          <div className="adm-card adm-bigstat" key={i}>
            <div className="adm-bigstat-val" style={k.accent ? { color: 'var(--mr-accent)' } : null}>{k.value}</div>
            <div className="adm-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}><FinStatusCard /></div>

      <div className="adm-mini-grid">
        {window.FINANCE_MINI.map((m, i) => (
          <div className="adm-card adm-mini-kpi" key={i}>
            <span className={'adm-kpi-ic' + (m.tone === 'danger' ? ' danger' : '')} style={m.tone === 'danger' ? { background: 'rgba(255,120,79,0.15)', color: 'var(--mr-danger)' } : null}><Icon name={m.icon} size={20} /></span>
            <span>
              <span className="adm-bigstat-val" style={{ fontSize: 22, display: 'block', color: m.tone === 'danger' ? 'var(--mr-danger)' : 'var(--mr-fg)' }}>{m.value}</span>
              <span className="adm-kpi-label">{m.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-card-head"><h3 className="adm-card-title">Receita mensal</h3><span className="adm-card-hint">últimos 12 meses</span></div>
        <AreaChart data={window.FINANCE_REVENUE} formatY={(v) => 'R$' + v} height={240} />
      </div>

      <h2 className="adm-section-title">Pagamentos</h2>
      <div className="adm-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="adm-kpi-label">Status</span>
          <div style={{ width: 180 }}><SelectInput value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={statusOpts} /></div>
        </div>
        <div className="adm-toolbar-right"><StateSwitcher value={state} onChange={setState} /></div>
      </div>
      <DataTable
        columns={columns} rows={filtered} state={state} onRetry={() => setState('data')}
        emptyTitle="Nenhum pagamento" emptyMsg="Nenhum pagamento neste filtro."
        page={page} perPage={8} onPage={setPage}
      />

      {/* Atualizar status do pagamento */}
      <Modal open={!!edit} onClose={() => setEdit(null)} size="sm" title="Atualizar status do pagamento"
        subtitle={edit ? `Pagamento ${edit.id} · ${window.brl(edit.amount)}` : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setEdit(null)}>Cancelar</Button><Button variant="primary" size="sm" onClick={saveStatus}>Salvar</Button></>}>
        {edit && (
          <Field label="Status do pagamento">
            <SelectInput value={statusDraft} onChange={setStatusDraft} options={Object.keys(window.PAYMENT_STATUS_LABEL).map((k) => ({ value: k, label: window.PAYMENT_STATUS_LABEL[k] }))} />
          </Field>
        )}
      </Modal>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
        title="Excluir pagamento" confirmLabel="Excluir" confirmWord={del && del.id}
        message={del ? <>Esta ação é irreversível. O pagamento <b style={{ color: 'var(--mr-fg)' }}>{del.id}</b> ({window.brl(del.amount)}) será removido.</> : ''} />
    </div>
  );
}

Object.assign(window, { Financial });
