// AdminApp.jsx — raiz do protótipo admin (estado de rota + placeholders)

const ROUTE_LABELS = {
  titles: 'Títulos', tags: 'Tags', news: 'Notícias', events: 'Eventos',
  users: 'Usuários', groups: 'Grupos', financial: 'Financeiro', subscriptions: 'Assinaturas',
};

function ComingSoon({ route, go }) {
  const label = ROUTE_LABELS[route] || 'Tela';
  return (
    <div className="adm-page">
      <div className="adm-placeholder">
        <img src="../../assets/illustrations/pensando.png" alt="" />
        <h2>{label}</h2>
        <p>Esta tela faz parte do redesign e será construída em seguida, uma de cada vez.
           A <b style={{ color: 'var(--mr-fg)' }}>Visão geral</b> e o shell (header + navegação responsiva) já estão prontos.</p>
        <div className="tag"><Badge variant="neutral">Em construção</Badge></div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
          <Button variant="raised" icon="home" onClick={() => go('overview')}>Voltar para a Visão geral</Button>
        </div>
      </div>
    </div>
  );
}

function AdminApp() {
  const [route, setRoute] = React.useState(() => {
    const h = (window.location.hash || '').replace('#', '');
    return ROUTE_LABELS[h] || h === 'overview' ? h : 'overview';
  });

  React.useEffect(() => {
    window.location.hash = route;
  }, [route]);

  const go = setRoute;

  let page;
  if (route === 'overview') page = <Overview go={go} />;
  else if (route === 'users') page = <Users go={go} />;
  else if (route === 'titles') page = <Titles go={go} />;
  else if (route === 'tags') page = <Tags go={go} />;
  else if (route === 'news') page = <News go={go} />;
  else if (route === 'events') page = <Events go={go} />;
  else if (route === 'groups') page = <Groups go={go} />;
  else if (route === 'financial') page = <Financial go={go} />;
  else if (route === 'subscriptions') page = <Subscriptions go={go} />;
  else page = <ComingSoon route={route} go={go} />;

  return (
    <AdminShell route={route} setRoute={setRoute}>
      {page}
    </AdminShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
