// templates/admin/ds-base.js
// Carrega os tokens do Design System Manga Reader para esta página de template.
// (Não carrega _ds_bundle.js: este template é autocontido e o bundle deste
//  projeto monta apps de demonstração no #root. Só precisamos dos tokens mr-*.)
(() => {
  const base = '../..';
  for (const p of ['styles.css']) {
    if (document.querySelector(`link[href$="${p}"]`)) continue; // evita duplicar
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = base + '/' + p;
    document.head.appendChild(l);
  }
})();
