// App.jsx — Manga Reader UI kit demo (com auth simulado)
const { useState } = React;

function App() {
  const [route, setRoute] = useState('home');
  const [selected, setSelected] = useState(null);
  const [library, setLibrary] = useState(new Set(['op','fr']));
  const [user, setUser] = useState(null); // null = deslogado por padrão
  const [composerOpen, setComposerOpen] = useState(false);

  const go = (r, id) => {
    setRoute(r);
    if (id !== undefined) setSelected(id);
    window.scrollTo(0, 0);
  };
  const toggleLib = (id) => setLibrary(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const openTitle = (id) => go('title', id);
  const openGroup = (id) => go('group', id);
  const openEvent = (id) => go('event', id);
  const openTopic = (id) => go('topic', id);
  const login = (u) => { setUser(u); go('profile'); };
  const logout = () => { setUser(null); go('home'); };

  // Rotas que exigem login — redireciona para /login se deslogado
  const protectedRoutes = ['profile'];
  const effectiveRoute = (protectedRoutes.includes(route) && !user) ? 'login' : route;

  return (
    <div className="app" data-screen-label={`app / ${effectiveRoute}`}>
      <NavigationMenu onNav={go} route={effectiveRoute} library={library} user={user}/>

      <main className="main">
        {effectiveRoute === 'home'     && <HomePage onOpenTitle={openTitle} library={library} toggleLib={toggleLib} onNav={go}/>}
        {effectiveRoute === 'title'    && <TitlePage id={selected} onRead={() => go('reader', selected)} library={library} toggleLib={toggleLib}/>}
        {effectiveRoute === 'library'  && <LibraryPage onOpenTitle={openTitle} library={library}/>}
        {effectiveRoute === 'profile'  && <ProfilePage onOpenTitle={openTitle} user={user} onLogout={logout}/>}
        {effectiveRoute === 'reader'   && <ReaderPage id={selected} onBack={() => go('title', selected)}/>}
        {effectiveRoute === 'news'     && <NewsPage/>}
        {effectiveRoute === 'genres'   && <CategoriesPage onOpenTitle={openTitle} library={library} toggleLib={toggleLib}/>}
        {effectiveRoute === 'search'   && <CategoriesPage onOpenTitle={openTitle} library={library} toggleLib={toggleLib}/>}
        {effectiveRoute === 'groups'   && <GroupsPage onOpenGroup={openGroup}/>}
        {effectiveRoute === 'group'    && <GroupDetailPage id={selected} onBack={()=>go('groups')} onOpenTitle={openTitle}/>}
        {effectiveRoute === 'events'   && <EventsPage onOpenEvent={openEvent}/>}
        {effectiveRoute === 'event'    && <EventDetailPage id={selected} onBack={()=>go('events')}/>}
        {effectiveRoute === 'login'    && <LoginPage onLogin={login} onNav={go}/>}
        {effectiveRoute === 'register' && <RegisterPage onLogin={login} onNav={go}/>}
        {effectiveRoute === 'forgot'   && <ForgotPasswordPage onNav={go}/>}
        {effectiveRoute === 'trending' && <TrendingPage onOpenTitle={openTitle} library={library} toggleLib={toggleLib} onNav={go}/>}
        {effectiveRoute === 'new'      && <NewReleasesPage onOpenTitle={openTitle} onNav={go}/>}
        {effectiveRoute === 'settings' && <SystemSettingsPage/>}
        {effectiveRoute === 'forum'    && <ForumPage onOpenTopic={openTopic} onOpenCompose={()=>setComposerOpen(true)} onNav={go}/>}
        {effectiveRoute === 'topic'    && <ForumTopicPage topicId={selected} onBack={()=>go('forum')} onOpenTopic={openTopic}/>}
        {effectiveRoute === 'help'     && <HelpCenterPage onNav={go}/>}
        {effectiveRoute === 'terms'    && <TermsPage onNav={go}/>}
        {effectiveRoute === 'privacy'  && <PrivacyPage onNav={go}/>}
        {effectiveRoute === 'dmca'     && <DmcaPage onNav={go}/>}
        {effectiveRoute === 'contact'  && <ContactPage onNav={go}/>}
      </main>

      <ForumComposer open={composerOpen} onClose={()=>setComposerOpen(false)}/>

      <Footer onNav={go} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
