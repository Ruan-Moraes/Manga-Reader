// Overview.jsx — Visão geral (dashboard admin)

function KpiCard({ kpi, go }) {
  const danger = kpi.tone === 'danger';
  return (
    <button className={'adm-kpi' + (danger ? ' danger' : '') + (kpi.route ? '' : ' static')}
            onClick={() => kpi.route && go(kpi.route)}>
      <span className="adm-kpi-ic"><Icon name={kpi.icon} size={22} /></span>
      <span>
        <span className="adm-kpi-val" style={{ display: 'block' }}>{kpi.value}</span>
        <span className="adm-kpi-label">{kpi.label}</span>
      </span>
    </button>
  );
}

function DistCard({ title, data }) {
  const max = Math.max(...data.rows.map((r) => r.count), 1);
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <h3 className="adm-card-title">{title}</h3>
        <span className="adm-card-hint">{data.total} no total</span>
      </div>
      <div>
        {data.rows.map((r) => {
          const pct = data.total ? Math.round((r.count / data.total) * 100) : 0;
          return (
            <div className="adm-dist-row" key={r.key}>
              <span className="adm-dist-label">
                <span className="adm-dist-dot" style={{ background: window.TONE_FILL[r.tone] }} />
                {r.label}
              </span>
              <span className="adm-dist-count">{r.count} · {pct}%</span>
              <span className="adm-dist-bar">
                <span className="adm-dist-fill" style={{ width: (r.count / max * 100) + '%', background: window.TONE_FILL[r.tone] }} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleCard() {
  const roles = window.ADMIN_ROLES;
  const total = roles.reduce((a, r) => a + r.count, 0);
  const toneVar = { admin: 'var(--role-admin)', mod: 'var(--role-mod)', member: 'var(--role-member)' };
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <h3 className="adm-card-title">Distribuição por role</h3>
        <span className="adm-card-hint">{total} usuários</span>
      </div>
      <div className="adm-rolebar">
        {roles.map((r) => (
          <span key={r.role} style={{ width: (r.count / total * 100) + '%', background: toneVar[r.tone] }} />
        ))}
      </div>
      <div className="adm-role-legend">
        {roles.map((r) => (
          <span className="adm-role-leg" key={r.role}>
            <span className="adm-dist-dot" style={{ background: toneVar[r.tone] }} />
            <span>{r.role}</span> <b>{r.count}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function TrendCard() {
  const t = window.ADMIN_TREND;
  const items = [t.newUsers, t.newTitles];
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <h3 className="adm-card-title">Crescimento</h3>
        <span className="adm-card-hint">últimos 30 dias</span>
      </div>
      <div style={{ display: 'grid', gap: 18 }}>
        {items.map((it, i) => {
          const max = Math.max(...it.series, 1);
          return (
            <div key={i}>
              <div className="adm-kpi-label" style={{ marginBottom: 8 }}>{it.label}</div>
              <div className="adm-trend">
                <span>
                  <span className="adm-trend-val">{it.value}</span>{' '}
                  <span className="adm-trend-delta">▲ {it.delta}%</span>
                </span>
                <span className="adm-spark">
                  {it.series.map((v, j) => (
                    <span key={j} className={j === it.series.length - 1 ? 'last' : ''}
                          style={{ height: (v / max * 100) + '%' }} />
                  ))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingTable() {
  return (
    <div className="adm-table-wrap">
      <div className="adm-table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>#</th>
              <th>Obra</th>
              <th>Tipo</th>
              <th className="adm-th-right">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {window.ADMIN_RANKING.map((r) => (
              <tr key={r.rank}>
                <td><span className={'adm-rank-num' + (r.rank === 1 ? ' adm-rank-1' : '')}>{r.rank}</span></td>
                <td style={{ fontWeight: 700 }}>{r.title}</td>
                <td><span style={{ color: 'var(--mr-fg-subtle)' }}>{r.type}</span></td>
                <td className="adm-td-right">
                  <span className="adm-rating">
                    <span style={{ color: 'var(--mr-accent)', fontSize: 13 }}>★</span>
                    <span className="adm-rating-val">{r.rating.toFixed(1)}</span>
                    <span className="adm-rating-votes">({r.votes})</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Overview({ go }) {
  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Visão geral</h1>
          <p className="adm-page-sub">Resumo da plataforma em tempo real.</p>
        </div>
      </div>

      <div className="adm-kpi-grid">
        {window.ADMIN_KPIS.map((k) => <KpiCard key={k.id} kpi={k} go={go} />)}
      </div>

      <div className="adm-grid-2" style={{ marginTop: 16 }}>
        <RoleCard />
        <TrendCard />
      </div>

      <h2 className="adm-section-title">Conteúdo</h2>
      <div className="adm-grid-2">
        <DistCard title="Obras por status" data={window.ADMIN_TITLES_STATUS} />
        <DistCard title="Eventos por status" data={window.ADMIN_EVENTS_STATUS} />
      </div>

      <h2 className="adm-section-title">Top 10 obras por ranking</h2>
      <RankingTable />
    </div>
  );
}

Object.assign(window, { Overview });
