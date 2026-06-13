// AdminModals.jsx — Modal genérico, confirmação (digite p/ confirmar) e campos de formulário.
// Padrões reutilizados por todas as telas (editar via modal).

function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', danger }) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  const maxW = { sm: 420, md: 520, lg: 680 }[size] || 520;

  return (
    <div className="adm-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className="adm-modal" style={{ maxWidth: maxW }} role="dialog" aria-modal="true">
        <div className="adm-modal-head">
          <div style={{ minWidth: 0 }}>
            <h3 className="adm-modal-title" style={danger ? { color: 'var(--mr-danger)' } : null}>{title}</h3>
            {subtitle && <p className="adm-modal-sub">{subtitle}</p>}
          </div>
          <button className="adm-modal-x" aria-label="Fechar" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ConfirmModal — confirmação destrutiva opcionalmente exigindo digitar um código (ex.: ID).
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', confirmWord, danger = true }) {
  const [val, setVal] = React.useState('');
  React.useEffect(() => { if (open) setVal(''); }, [open]);
  const locked = confirmWord != null && val.trim() !== String(confirmWord);

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" danger={danger}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
          <Button variant="ghost" danger size="sm" onClick={() => !locked && onConfirm()}>
            <span style={{ opacity: locked ? 0.45 : 1 }}>{confirmLabel}</span>
          </Button>
        </>
      }>
      <p style={{ margin: '0 0 14px', color: 'var(--mr-fg-muted)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      {confirmWord != null && (
        <Field label={<>Digite <code style={{ color: 'var(--mr-accent)' }}>{confirmWord}</code> para confirmar</>}>
          <TextInput value={val} onChange={setVal} placeholder={String(confirmWord)} autoFocus />
        </Field>
      )}
    </Modal>
  );
}

// ---------- Campos de formulário ----------
function Field({ label, hint, required, children, lang }) {
  return (
    <label className="adm-field">
      {label && (
        <span className="adm-field-label">
          {label}{required && <span style={{ color: 'var(--mr-danger)' }}> *</span>}
          {lang && <LangTabs />}
        </span>
      )}
      {children}
      {hint && <span className="adm-field-hint">{hint}</span>}
    </label>
  );
}

// Seletor de idioma desenhado (i18n por idioma — pt-BR / en-US / es-ES)
function LangTabs({ value = 'pt-BR', onChange }) {
  const [v, setV] = React.useState(value);
  const langs = ['pt-BR', 'en-US', 'es-ES'];
  return (
    <span className="adm-langtabs">
      {langs.map((l) => (
        <button type="button" key={l} className={'adm-langtab' + (v === l ? ' active' : '')}
          onClick={() => { setV(l); onChange && onChange(l); }}>
          {l}<span className="adm-langdot" />
        </button>
      ))}
    </span>
  );
}

function TextInput({ value, onChange, placeholder, autoFocus, type = 'text' }) {
  return (
    <input className="adm-input" type={type} value={value} placeholder={placeholder} autoFocus={autoFocus}
      onChange={(e) => onChange && onChange(e.target.value)} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea className="adm-input adm-textarea" rows={rows} value={value} placeholder={placeholder}
      onChange={(e) => onChange && onChange(e.target.value)} />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <div className="adm-select-wrap">
      <select className="adm-input adm-select" value={value} onChange={(e) => onChange && onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
      <span className="adm-select-caret"><Icon name="chevronD" size={16} /></span>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange && onChange(e.target.checked)} />
      <span className="adm-toggle-track"><span className="adm-toggle-knob" /></span>
      {label && <span className="adm-toggle-label">{label}</span>}
    </label>
  );
}

// Campo localizado (i18n por idioma): value = { 'pt-BR', 'en-US', 'es-ES' }
function LocalizedField({ label, required, value = {}, onChange, multiline, rows = 3, placeholder }) {
  const [lang, setLang] = React.useState('pt-BR');
  const langs = ['pt-BR', 'en-US', 'es-ES'];
  const set = (v) => onChange && onChange({ ...value, [lang]: v });
  const filled = (l) => (value[l] || '').trim().length > 0;
  return (
    <div className="adm-field">
      <span className="adm-field-label">
        {label}{required && <span style={{ color: 'var(--mr-danger)' }}> *</span>}
        <span className="adm-langtabs">
          {langs.map((l) => (
            <button type="button" key={l} className={'adm-langtab' + (lang === l ? ' active' : '')} onClick={() => setLang(l)}>
              {l}<span className="adm-langdot" style={filled(l) ? { background: 'var(--mr-accent)' } : null} />
            </button>
          ))}
        </span>
      </span>
      {multiline
        ? <textarea className="adm-input adm-textarea" rows={rows} value={value[lang] || ''} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
        : <input className="adm-input" value={value[lang] || ''} placeholder={placeholder} onChange={(e) => set(e.target.value)} />}
    </div>
  );
}

Object.assign(window, { Modal, ConfirmModal, Field, LangTabs, LocalizedField, TextInput, Textarea, SelectInput, Toggle });
