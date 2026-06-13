// Subscriptions.jsx — tela Assinaturas (KPIs + crescimento + abas Assinaturas/Planos/Logs)

function SubStatus({ status }) {
  return <StatusPill tone={window.SUB_STATUS_TONE[status] || 'soon'}>{status}</StatusPill>;
}

function SubKpis() {
  const tones = {
    live: { bg: 'var(--mr-accent-25)', c: 'var(--mr-accent)' },
    soon: { bg: 'var(--mr-gray-800)', c: 'var(--mr-fg-muted)' },
    ended: { bg: 'rgba(255,120,79,0.15)', c: 'var(--mr-danger)' },
  };
  return (
    <div className="adm-kpi-grid">
      {window.SUB_KPIS.map((k, i) => (
        <div className="adm-kpi static" key={i}>
          <span className="adm-kpi-ic" style={{ background: tones[k.tone].bg, color: tones[k.tone].c }}><Icon name={k.icon} size={22} /></span>
          <span>
            <span className="adm-kpi-val" style={{ display: 'block', color: tones[k.tone].c }}>{k.value}</span>
            <span className="adm-kpi-label">{k.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function PlansTab() {
  return (
    <div className="adm-plans">
      {window.SUB_PLANS.map((p) => (
        <div className={'adm-card adm-plan' + (p.popular ? ' popular' : '')} key={p.name}>
          {p.popular && <span className="adm-plan-flag">Mais popular</span>}
          <div className="adm-plan-name">{p.name}</div>
          <div className="adm-plan-price">{window.brl(p.price)}<span>{p.period}</span></div>
          <ul className="adm-plan-feats">
            {p.features.map((f, i) => <li key={i}><span className="adm-check">✓</span>{f}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LogsTab() {
  return (
    <div className="adm-card">
      <div className="adm-logs">
        {window.SUB_LOGS.map((l, i) => (
          <div className="adm-log" key={i}>
            <span className="adm-dist-dot" style={{ background: window.TONE_FILL[l.tone], borderRadius: '50%', marginTop: 6 }} />
            <span style={{ flex: 1 }}>
              <span style={{ fontSize: 14 }}><b style={{ fontWeight: 700 }}>{l.who}</b> {l.action}</span>
              <span className="adm-log-when">{l.when}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Subscriptions({ go }) {
  const [subs, setSubs] = React.useState(() => window.SUB_ROWS.map((s) => ({ ...s })));
  const [tab, setTab] = React.useState('subs');
  const [filter, setFilter] = React.useState('');
  const [state, setState] = React.useState('data');
  const [page, setPage] = React.useState(1);
  const [grant, setGrant] = React.useState(false);
  const [grantDraft, setGrantDraft] = React.useState({ user: '', plan: 'Mensal' });
  const [edit, setEdit] = React.useState(null);
  const [statusDraft, setStatusDraft] = React.useState('');
  const [del, setDel] = React.useState(null);

  const filtered = subs.filter((s) => !filter || s.status === filter);
  const priceOf = { 'Diário': 0.39, 'Mensal': 19.90, 'Anual': 199.00 };

  const doGrant = () => {
    const id = Math.random().toString(16).slice(2, 10);
    setSubs((ss) => [{ id, user: (grantDraft.user || 'novo').slice(0, 8), plan: grantDraft.plan, price: priceOf[grantDraft.plan], status: 'Ativa', start: '13/06/2026', end: '13/07/2026' }, ...ss]);
    setGrant(false); setGrantDraft({ user: '', plan: 'Mensal' });
  };
  const saveStatus = () => { setSubs((ss) => ss.map((s) => s.id === edit.id ? { ...s, status: statusDraft } : s)); setEdit(null); };
  const confirmDelete = () => { setSubs((ss) => ss.filter((s) => s.id !== del.id)); setDel(null); };

  const statusOpts = [{ value: '', label: 'Todos' }, ...['Ativa', 'Expirada', 'Cancelada'].map((s) => ({ value: s, label: s }))];

  const columns = [
    { header: 'ID', width: 96, hideBelow: 'md', render: (s) => <span className="adm-mono">{s.id}</span> },
    { header: 'Usuário', hideBelow: 'sm', render: (s) => <span className="adm-mono" style={{ color: 'var(--mr-fg-subtle)' }}>{s.user}</span> },
    { header: 'Plano', render: (s) => (
      <span><b style={{ fontWeight: 700 }}>{s.plan}</b> <span style={{ color: 'var(--mr-fg-subtle)', fontSize: 12 }}>{window.brl(s.price)}</span></span>
    )},
    { header: 'Status', render: (s) => <SubStatus status={s.status} /> },
    { header: 'Início', hideBelow: 'md', render: (s) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{s.start}</span> },
    { header: 'Fim', render: (s) => <span style={{ color: 'var(--mr-fg-subtle)' }}>{s.end}</span> },
    { header: 'Ações', align: 'right', width: 96, render: (s) => (
      <div className="adm-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" title="Atualizar status" onClick={() => { setEdit(s); setStatusDraft(s.status); }} />
        <IconButton icon="trash" danger title="Excluir" onClick={() => setDel(s)} />
      </div>
    )},
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Assinaturas</h1>
          <p className="adm-page-sub">Planos, pagamentos recorrentes e histórico.</p>
        </div>
      </div>

      <SubKpis />

      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-card-head"><h3 className="adm-card-title">Crescimento de assinaturas</h3><span className="adm-card-hint">últimos 12 meses</span></div>
        <GrowthBars data={window.SUB_GROWTH} height={240} />
        <ChartLegend items={[{ label: 'Novas', color: 'var(--mr-accent)' }, { label: 'Canceladas', color: 'var(--mr-danger)' }]} />
      </div>

      <div style={{ marginTop: 22 }}>
        <Tabs tabs={[{ key: 'subs', label: 'Assinaturas' }, { key: 'plans', label: 'Planos' }, { key: 'logs', label: 'Logs' }]} active={tab} onChange={setTab} />
      </div>

      {tab === 'subs' && (
        <div style={{ marginTop: 16 }}>
          <div className="adm-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="adm-kpi-label">Status</span>
              <div style={{ width: 170 }}><SelectInput value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={statusOpts} /></div>
            </div>
            <div className="adm-toolbar-right">
              <StateSwitcher value={state} onChange={setState} />
              <Button variant="primary" size="sm" icon="plus" onClick={() => setGrant(true)}>Conceder</Button>
            </div>
          </div>
          <DataTable columns={columns} rows={filtered} state={state} onRetry={() => setState('data')}
            emptyTitle="Nenhuma assinatura" emptyMsg="Nenhuma assinatura neste filtro."
            page={page} perPage={8} onPage={setPage} />
        </div>
      )}
      {tab === 'plans' && <div style={{ marginTop: 16 }}><PlansTab /></div>}
      {tab === 'logs' && <div style={{ marginTop: 16 }}><LogsTab /></div>}

      {/* Conceder assinatura */}
      <Modal open={grant} onClose={() => setGrant(false)} size="sm" title="Conceder assinatura"
        footer={<><Button variant="ghost" size="sm" onClick={() => setGrant(false)}>Cancelar</Button><Button variant="primary" size="sm" onClick={doGrant}>Conceder</Button></>}>
        <Field label="Usuário" required>
          <SelectInput value={grantDraft.user} onChange={(v) => setGrantDraft((d) => ({ ...d, user: v }))}
            options={window.ADMIN_USERS.map((u) => ({ value: u.id, label: `${u.name} · ${u.id}` }))} placeholder="Selecione o usuário" />
        </Field>
        <Field label="Plano">
          <SelectInput value={grantDraft.plan} onChange={(v) => setGrantDraft((d) => ({ ...d, plan: v }))} options={['Diário', 'Mensal', 'Anual']} />
        </Field>
      </Modal>

      {/* Atualizar status */}
      <Modal open={!!edit} onClose={() => setEdit(null)} size="sm" title="Atualizar assinatura"
        subtitle={edit ? `${edit.plan} · ${edit.id}` : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setEdit(null)}>Cancelar</Button><Button variant="primary" size="sm" onClick={saveStatus}>Salvar</Button></>}>
        {edit && <Field label="Status"><SelectInput value={statusDraft} onChange={setStatusDraft} options={['Ativa', 'Expirada', 'Cancelada']} /></Field>}
      </Modal>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
        title="Excluir assinatura" confirmLabel="Excluir" confirmWord={del && del.id}
        message={del ? <>Esta ação é irreversível. A assinatura <b style={{ color: 'var(--mr-fg)' }}>{del.id}</b> será removida.</> : ''} />
    </div>
  );
}

Object.assign(window, { Subscriptions });
