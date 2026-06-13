// Charts.jsx — gráficos leves em SVG (área de receita, barras de crescimento) + abas.

// Área/linha — série mensal. data: [{ label, value }]
function AreaChart({ data, formatY = (v) => v, height = 240, accent = 'var(--mr-accent)' }) {
  const W = 640, H = height, padL = 52, padR = 12, padT = 12, padB = 28;
  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => padT + innerH - (v / niceMax) * innerH;
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const area = `${line} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const ticks = [0, 1, 2, 3, 4].map((k) => (niceMax / 4) * k);
  const everyOther = data.length > 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--mr-gray-900)" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--mr-fg-subtle)">{formatY(t)}</text>
        </g>
      ))}
      <path d={area} fill={accent} opacity="0.12" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => i === pts.length - 1 && (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={accent} stroke="var(--mr-surface)" strokeWidth="2" />
      ))}
      {data.map((d, i) => (!everyOther || i % 2 === 0) && (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--mr-fg-subtle)">{d.label}</text>
      ))}
    </svg>
  );
}

// Barras agrupadas — novas (accent) vs canceladas (coral). data: [{ label, novas, canceladas }]
function GrowthBars({ data, height = 240 }) {
  const W = 640, H = height, padL = 36, padR = 12, padT = 12, padB = 28;
  const max = Math.max(...data.flatMap((d) => [d.novas, d.canceladas]), 1);
  const niceMax = Math.max(Math.ceil(max), 1);
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const slot = innerW / data.length;
  const bw = Math.min(10, slot / 3);
  const y = (v) => padT + innerH - (v / niceMax) * innerH;
  const ticks = [0, 1, 2, 3, 4].map((k) => (niceMax / 4) * k);
  const everyOther = data.length > 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="xMidYMid meet">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--mr-gray-900)" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--mr-fg-subtle)">{Math.round(t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = padL + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={y(d.novas)} width={bw} height={padT + innerH - y(d.novas)} fill="var(--mr-accent)" rx="1" />
            <rect x={cx + 1} y={y(d.canceladas)} width={bw} height={padT + innerH - y(d.canceladas)} fill="var(--mr-danger)" rx="1" />
            {(!everyOther || i % 2 === 0) && <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--mr-fg-subtle)">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function ChartLegend({ items }) {
  return (
    <div className="adm-chart-legend">
      {items.map((it) => (
        <span key={it.label} className="adm-role-leg"><span className="adm-dist-dot" style={{ background: it.color, borderRadius: '50%' }} />{it.label}</span>
      ))}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="adm-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" className={'adm-tab' + (active === t.key ? ' active' : '')} onClick={() => onChange(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { AreaChart, GrowthBars, ChartLegend, Tabs });
