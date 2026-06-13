// DataTable.jsx — tabela genérica do admin: toolbar de busca, estados (dados/loading/vazio/erro),
// colunas que somem no mobile e paginação. Reutilizada em todas as listas.

function Toolbar({ search, onSearch, onSubmit, placeholder = 'Buscar...', right }) {
  return (
    <div className="adm-toolbar">
      <form className="adm-search" onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(); }}>
        <span className="adm-search-ic"><Icon name="search" size={16} /></span>
        <input className="adm-input adm-search-input" value={search} placeholder={placeholder}
          onChange={(e) => onSearch && onSearch(e.target.value)} />
        <button type="submit" className="adm-search-btn">Buscar</button>
      </form>
      {right && <div className="adm-toolbar-right">{right}</div>}
    </div>
  );
}

function StateBlock({ kind, onRetry, emptyTitle, emptyMsg }) {
  if (kind === 'error') {
    return (
      <div className="adm-state">
        <img src="../../assets/illustrations/zangada.png" alt="" />
        <h3>Algo deu errado</h3>
        <p>Não foi possível carregar os dados. Verifique a conexão e tente novamente.</p>
        <Button variant="raised" icon="refresh" onClick={onRetry}>Tentar de novo</Button>
      </div>
    );
  }
  return (
    <div className="adm-state">
      <img src="../../assets/illustrations/duvida.png" alt="" />
      <h3>{emptyTitle || 'Nada por aqui'}</h3>
      <p>{emptyMsg || 'Nenhum registro encontrado. Ajuste a busca ou crie um novo.'}</p>
    </div>
  );
}

function SkeletonRows({ columns, count = 6 }) {
  return (
    <tbody>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          {columns.map((c, j) => (
            <td key={j} className={c.hideBelow ? 'hide-' + c.hideBelow : ''}>
              <span className="adm-skel" style={{ width: c.skelW || (j === 0 ? 40 : '70%') }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) nums.push(i);
  return (
    <div className="adm-pagination">
      <button className="adm-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <Icon name="chevronL" size={15} /> Anterior
      </button>
      <div className="adm-page-nums">
        {nums.map((n) => (
          <button key={n} className={'adm-page-num' + (n === page ? ' active' : '')} onClick={() => onPage(n)}>{n}</button>
        ))}
      </div>
      <button className="adm-page-btn" disabled={page === pages} onClick={() => onPage(page + 1)}>
        Próxima <Icon name="chevronR" size={15} />
      </button>
    </div>
  );
}

function DataTable({
  columns, rows, state = 'data', onRetry,
  search, onSearch, onSubmitSearch, searchPlaceholder, toolbarRight,
  emptyTitle, emptyMsg, onRowClick, getRowKey,
  page = 1, perPage = 0, onPage,
}) {
  const pages = perPage ? Math.ceil(rows.length / perPage) : 1;
  const pageRows = perPage ? rows.slice((page - 1) * perPage, page * perPage) : rows;

  return (
    <div>
      {(onSearch || toolbarRight) && (
        <Toolbar search={search} onSearch={onSearch} onSubmit={onSubmitSearch} placeholder={searchPlaceholder} right={toolbarRight} />
      )}

      <div className="adm-table-wrap">
        {state !== 'data' && state !== 'loading' ? (
          <StateBlock kind={state} onRetry={onRetry} emptyTitle={emptyTitle} emptyMsg={emptyMsg} />
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  {columns.map((c, i) => (
                    <th key={i} className={(c.hideBelow ? 'hide-' + c.hideBelow + ' ' : '') + (c.align === 'right' ? 'adm-th-right' : '')}
                        style={c.width ? { width: c.width } : null}>{c.header}</th>
                  ))}
                </tr>
              </thead>
              {state === 'loading'
                ? <SkeletonRows columns={columns} />
                : (
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={getRowKey ? getRowKey(row) : row.id}
                          onClick={onRowClick ? () => onRowClick(row) : undefined}
                          style={onRowClick ? { cursor: 'pointer' } : null}>
                        {columns.map((c, i) => (
                          <td key={i} className={(c.hideBelow ? 'hide-' + c.hideBelow + ' ' : '') + (c.align === 'right' ? 'adm-td-right' : '')}>
                            {c.render ? c.render(row) : row[c.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
            </table>
          </div>
        )}
      </div>

      {state === 'data' && <Pagination page={page} pages={pages} onPage={onPage} />}
    </div>
  );
}

// Segmented control para demonstrar os estados da lista (afordância de revisão).
function StateSwitcher({ value, onChange }) {
  const opts = [['data', 'Dados'], ['loading', 'Carregando'], ['empty', 'Vazio'], ['error', 'Erro']];
  return (
    <div className="adm-stateswitch" title="Demonstração dos estados da lista">
      <span className="adm-stateswitch-label">Estado</span>
      {opts.map(([v, l]) => (
        <button key={v} className={'adm-stateswitch-btn' + (value === v ? ' active' : '')} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

Object.assign(window, { DataTable, Toolbar, Pagination, StateSwitcher });
