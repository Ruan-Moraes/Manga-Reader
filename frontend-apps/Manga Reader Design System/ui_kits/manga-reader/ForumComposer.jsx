// ForumComposer.jsx — modal de criação de tópico
// Editor com toolbar Markdown, seleção de categoria, tags, drag & drop, preview

function ForumComposer({ open, onClose }) {
  const [step, setStep]         = React.useState('write'); // write | preview
  const [title, setTitle]       = React.useState('');
  const [body, setBody]         = React.useState('');
  const [category, setCategory] = React.useState('discussao');
  const [tags, setTags]         = React.useState(['discussao']);
  const [drag, setDrag]         = React.useState(false);
  const [images, setImages]     = React.useState([]); // {name, size}

  if (!open) return null;

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  const removeImage = (idx) => setImages(prev => prev.filter((_,i)=>i!==idx));

  // simula upload
  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) setImages(prev => [...prev, ...files.map(f => ({ name:f.name, size:f.size }))]);
  };

  return (
    <div className="composer-overlay" onClick={onClose}>
      <div className="composer-shell" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <header className="composer-head">
          <div>
            <div className="mr-label" style={{color:'#ddda2a', marginBottom:4, display:'inline-flex', alignItems:'center', gap:6}}>
              <Icon name="plus" size={13}/>Novo tópico
            </div>
            <h2 className="composer-title">Comece uma discussão</h2>
          </div>
          <button onClick={onClose} className="forum-icon-btn"><Icon name="close" size={20}/></button>
        </header>

        {/* Step switcher */}
        <div className="composer-steps">
          <button onClick={()=>setStep('write')}   className={`composer-step ${step==='write'?'active':''}`}>1 · Escrever</button>
          <button onClick={()=>setStep('preview')} className={`composer-step ${step==='preview'?'active':''}`}>2 · Pré-visualizar</button>
        </div>

        {/* Body */}
        <div className="composer-body">
          {step === 'write' ? (
            <>
              {/* Categoria */}
              <div className="composer-row">
                <label className="composer-label">
                  <span className="mr-label">Categoria</span>
                  <span style={{fontSize:11, color:'#999', marginLeft:8, fontWeight:400, textTransform:'none', letterSpacing:0}}>Onde a discussão vai morar.</span>
                </label>
                <div className="composer-cats">
                  {window.FORUM_CATEGORIES.filter(c => c.key !== 'home' && c.key !== 'staff').slice(0, 8).map(c => (
                    <button key={c.key} onClick={()=>setCategory(c.key)} className={`composer-cat ${category===c.key?'active':''}`}>
                      <Icon name={c.icon} size={14}/>{c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div className="composer-row">
                <label className="composer-label">
                  <span className="mr-label">Título</span>
                  <span style={{fontSize:11, color: title.length > 120?'#FF784F':'#999', marginLeft:'auto', fontWeight:700}}>{title.length}/120</span>
                </label>
                <input
                  className="composer-title-input"
                  placeholder="Algo curto, direto e que faça as pessoas quererem clicar."
                  value={title} onChange={e=>setTitle(e.target.value.slice(0,120))}
                />
              </div>

              {/* Tags */}
              <div className="composer-row">
                <label className="composer-label">
                  <span className="mr-label">Tags</span>
                  <span style={{fontSize:11, color:'#999', marginLeft:8, fontWeight:400, textTransform:'none', letterSpacing:0}}>Escolha até 4. Ajuda outras pessoas a encontrarem.</span>
                </label>
                <div className="composer-tags">
                  {Object.entries(window.FORUM_TAGS).map(([k, t]) => {
                    const active = tags.includes(k);
                    return (
                      <button key={k} onClick={()=>toggleTag(k)}
                        className={`forum-tag forum-tag-${t.tone} composer-tag ${active?'active':''}`}>
                        {active && <Icon name="check" size={11}/>}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editor */}
              <div className="composer-row">
                <label className="composer-label">
                  <span className="mr-label">Conteúdo</span>
                  <span style={{fontSize:11, color:'#999', marginLeft:8, fontWeight:400, textTransform:'none', letterSpacing:0}}>Markdown · <span style={{color:'#ddda2a'}}>[spoiler]</span> para esconder partes sensíveis.</span>
                </label>
                <div className="forum-md-toolbar composer-toolbar">
                  <button title="Negrito"><strong>B</strong></button>
                  <button title="Itálico"><em>I</em></button>
                  <button title="Citação">"</button>
                  <button title="Lista">≡</button>
                  <button title="Código">{'</>'}</button>
                  <button title="Link">⊕</button>
                  <span style={{width:1, height:18, background:'#444', margin:'0 4px'}}/>
                  <button title="Spoiler" className="forum-md-spoiler"><Icon name="eye" size={12}/>Spoiler</button>
                  <span style={{flex:1}}/>
                  <span style={{fontSize:10, color:'#727273', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{body.length} caracteres</span>
                </div>
                <textarea
                  className="composer-editor"
                  placeholder={'Comece a escrever…\n\nUse **negrito** para destacar.\nUse [spoiler]conteúdo sensível[/spoiler] para esconder.'}
                  value={body} onChange={e=>setBody(e.target.value)}
                  rows="9"
                />

                {/* Drop zone */}
                <div
                  className={`composer-drop ${drag?'dragging':''}`}
                  onDragOver={e=>{e.preventDefault(); setDrag(true);}}
                  onDragLeave={()=>setDrag(false)}
                  onDrop={onDrop}>
                  <Icon name="plus" size={18}/>
                  <div>
                    <div style={{color:'#fff', fontSize:13, fontWeight:700, letterSpacing:'.0625rem'}}>Arraste imagens aqui</div>
                    <div style={{color:'#999', fontSize:11, marginTop:2}}>PNG, JPG ou WEBP — máximo 5MB por imagem · até 6 imagens</div>
                  </div>
                  <Button variant="ghost">Selecionar arquivos</Button>
                </div>

                {/* Uploaded images */}
                {images.length > 0 && (
                  <div className="composer-uploads">
                    {images.map((img, i) => (
                      <div key={i} className="composer-upload">
                        <div className="composer-upload-thumb"><Icon name="eye" size={14}/></div>
                        <div style={{flex:1, minWidth:0}}>
                          <div className="composer-upload-name">{img.name}</div>
                          <div className="composer-upload-size">{Math.max(1, Math.round((img.size||0)/1024))} KB</div>
                        </div>
                        <button onClick={()=>removeImage(i)} className="forum-icon-btn"><Icon name="close" size={14}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="composer-row">
                <label className="composer-label"><span className="mr-label">Opções</span></label>
                <div className="composer-options">
                  <label className="composer-check">
                    <input type="checkbox" defaultChecked/>
                    <span>Notificar-me sobre novas respostas</span>
                  </label>
                  <label className="composer-check">
                    <input type="checkbox"/>
                    <span>Permitir comentários de leitores não verificados</span>
                  </label>
                  <label className="composer-check">
                    <input type="checkbox"/>
                    <span>Marcar como contendo spoilers (leitores precisam confirmar antes de abrir)</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            // PREVIEW
            <div className="composer-preview">
              <div className="forum-topic-meta">
                <span className="forum-topic-cat">{(window.FORUM_CATEGORIES.find(c=>c.key===category)||{}).label}</span>
                <span style={{flex:1}}/>
                <span className="forum-topic-when">há alguns segundos</span>
              </div>
              <h1 className="forum-topic-title">{title || <span style={{color:'#727273'}}>(seu título aparecerá aqui)</span>}</h1>
              <div className="forum-topic-tags">
                {tags.map(t => {
                  const tag = window.FORUM_TAGS[t]; if (!tag) return null;
                  return <span key={t} className={`forum-tag forum-tag-${tag.tone}`}>{tag.label}</span>;
                })}
              </div>
              <div className="forum-topic-author">
                <div className="forum-topic-author-block">
                  <Avatar initials="RM" color="#ddda2a" size={42}/>
                  <div>
                    <span style={{color:'#fff', fontWeight:800, fontSize:14, letterSpacing:'.0625rem'}}>Ruan Moraes</span>
                    <div style={{color:'#999', fontSize:11, marginTop:2}}>@ruanmoraes · Nível 18</div>
                  </div>
                </div>
              </div>
              <div className="forum-topic-content" style={{marginTop:18}}>
                {body
                  ? <RichBody text={body}/>
                  : <p style={{color:'#727273', fontStyle:'italic'}}>(seu conteúdo aparecerá aqui — escreva algo na aba "Escrever" e volte pra ver o resultado)</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="composer-foot">
          <div className="composer-meta">
            <Icon name="check" size={12}/>
            <span>Rascunho salvo automaticamente · {new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            {step === 'write'
              ? <Button variant="raised" onClick={()=>setStep('preview')}>Pré-visualizar →</Button>
              : <Button variant="raised" onClick={()=>setStep('write')}>← Voltar</Button>}
            <Button variant="primary" icon="check" onClick={onClose}>Publicar tópico</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { ForumComposer });
