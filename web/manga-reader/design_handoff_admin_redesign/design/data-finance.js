// data-finance.js — dados de Financeiro e Assinaturas
window.brl = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- Financeiro ----------
window.FINANCE_KPIS = [
  { label: 'Total de pagamentos', value: '10' },
  { label: 'Receita confirmada',  value: window.brl(10263.89), accent: true },
  { label: 'Receita pendente',    value: window.brl(1018.90) },
];

window.FINANCE_STATUS = [
  { key: 'PENDING',   label: 'Pendente',   tone: 'soon',  count: 2, total: 1018.90 },
  { key: 'COMPLETED', label: 'Concluído',  tone: 'live',  count: 5, total: 10263.89 },
  { key: 'FAILED',    label: 'Falhou',     tone: 'ended', count: 2, total: 39.80 },
  { key: 'REFUNDED',  label: 'Reembolsado',tone: 'open',  count: 1, total: 199.00 },
];

window.FINANCE_MINI = [
  { icon: 'dollar', label: 'Receita do mês', value: window.brl(2.54) },
  { icon: 'trending', label: 'Variação mensal', value: '-97,5%', tone: 'danger' },
  { icon: 'dollar', label: 'Receita anual', value: window.brl(102.64) },
];

window.FINANCE_REVENUE = [
  { label: 'jul/25', value: 4 }, { label: 'ago/25', value: 6 }, { label: 'set/25', value: 5 },
  { label: 'out/25', value: 8 }, { label: 'nov/25', value: 7 }, { label: 'dez/25', value: 10 },
  { label: 'jan/26', value: 9 }, { label: 'fev/26', value: 12 }, { label: 'mar/26', value: 18 },
  { label: 'abr/26', value: 42 }, { label: 'mai/26', value: 88 }, { label: 'jun/26', value: 110 },
];

window.PAYMENT_STATUS_TONE = { COMPLETED: 'live', PENDING: 'soon', FAILED: 'ended', REFUNDED: 'open' };
window.PAYMENT_STATUS_LABEL = { COMPLETED: 'Concluído', PENDING: 'Pendente', FAILED: 'Falhou', REFUNDED: 'Reembolsado' };

window.FINANCE_PAYMENTS = [
  { id: '864e13df', amount: 9999.99, status: 'COMPLETED', method: 'CREDIT_CARD', ref: 'DONATION',     created: '10/06/2026' },
  { id: '2ad54f76', amount: 10.00,   status: 'COMPLETED', method: '—',           ref: '—',            created: '10/06/2026' },
  { id: 'f1774efa', amount: 999.00,  status: 'PENDING',   method: 'BOLETO',      ref: 'SUBSCRIPTION', created: '10/06/2026' },
  { id: '8a7b524b', amount: 199.00,  status: 'REFUNDED',  method: 'CREDIT_CARD', ref: 'SUBSCRIPTION', created: '10/06/2026' },
  { id: '83f3aa23', amount: 19.90,   status: 'FAILED',    method: 'PIX',         ref: '—',            created: '10/06/2026' },
  { id: 'a5b6c7d8', amount: 199.00,  status: 'COMPLETED', method: 'CREDIT_CARD', ref: 'SUBSCRIPTION', created: '09/06/2026' },
  { id: '9f8e7d6c', amount: 0.39,    status: 'COMPLETED', method: 'PIX',         ref: 'SUBSCRIPTION', created: '08/06/2026' },
  { id: 'c1d2e3f4', amount: 19.90,   status: 'COMPLETED', method: 'PIX',         ref: 'SUBSCRIPTION', created: '08/06/2026' },
  { id: 'b2c3d4e5', amount: 19.90,   status: 'FAILED',    method: 'CREDIT_CARD', ref: 'SUBSCRIPTION', created: '07/06/2026' },
  { id: 'e6f7a8b9', amount: 19.90,   status: 'PENDING',   method: 'BOLETO',      ref: 'SUBSCRIPTION', created: '07/06/2026' },
];

// ---------- Assinaturas ----------
window.SUB_KPIS = [
  { icon: 'award',  label: 'Assinaturas ativas', value: 5, tone: 'live' },
  { icon: 'clock',  label: 'Expiradas',          value: 3, tone: 'soon' },
  { icon: 'close',  label: 'Canceladas',         value: 2, tone: 'ended' },
];

window.SUB_GROWTH = [
  { label: 'jul/25', novas: 0, canceladas: 0 }, { label: 'ago/25', novas: 0, canceladas: 0 },
  { label: 'set/25', novas: 0, canceladas: 0 }, { label: 'out/25', novas: 0, canceladas: 0 },
  { label: 'nov/25', novas: 0, canceladas: 0 }, { label: 'dez/25', novas: 1, canceladas: 0 },
  { label: 'jan/26', novas: 0, canceladas: 0 }, { label: 'fev/26', novas: 2, canceladas: 0 },
  { label: 'mar/26', novas: 1, canceladas: 1 }, { label: 'abr/26', novas: 2, canceladas: 0 },
  { label: 'mai/26', novas: 3, canceladas: 1 }, { label: 'jun/26', novas: 2, canceladas: 2 },
];

window.SUB_STATUS_TONE = { Ativa: 'live', Expirada: 'soon', Cancelada: 'ended' };

window.SUB_ROWS = [
  { id: '931cf797', user: 'b073bcdf', plan: 'Mensal', price: 19.90,  status: 'Cancelada', start: '10/03/2026', end: '10/04/2026' },
  { id: 'e962d426', user: '19a20fb1', plan: 'Anual',  price: 199.00, status: 'Ativa',     start: '31/05/2026', end: '30/05/2027' },
  { id: 'bb098d52', user: 'd67c40a1', plan: 'Anual',  price: 199.00, status: 'Expirada',  start: '10/04/2025', end: '10/04/2026' },
  { id: '546a0ca9', user: 'd66010ab', plan: 'Diário', price: 0.39,   status: 'Ativa',     start: '10/06/2026', end: '11/06/2026' },
  { id: '5953d096', user: 'b073bcdf', plan: 'Diário', price: 0.39,   status: 'Expirada',  start: '08/06/2026', end: '09/06/2026' },
  { id: 'dd4393f6', user: '19a20fb1', plan: 'Mensal', price: 19.90,  status: 'Cancelada', start: '11/05/2026', end: '10/06/2026' },
  { id: '258722e2', user: '113cdeb4', plan: 'Anual',  price: 199.00, status: 'Ativa',     start: '10/04/2026', end: '10/04/2027' },
  { id: '5be62897', user: 'd67c40a1', plan: 'Mensal', price: 19.90,  status: 'Expirada',  start: '26/04/2026', end: '26/05/2026' },
  { id: 'cf56c3fb', user: 'd66010ab', plan: 'Anual',  price: 199.00, status: 'Ativa',     start: '10/12/2025', end: '10/12/2026' },
  { id: '62b78d3a', user: 'b073bcdf', plan: 'Mensal', price: 19.90,  status: 'Ativa',     start: '26/05/2026', end: '25/06/2026' },
];

window.SUB_PLANS = [
  { name: 'Diário', price: 0.39,  period: '/dia',  features: ['Acesso por 24 horas', 'Leitura sem anúncios', 'Ideal para maratonar'] },
  { name: 'Mensal', price: 19.90, period: '/mês',  popular: true, features: ['Tudo do plano Diário', 'Leitura offline ilimitada', 'Selo de apoiador no perfil'] },
  { name: 'Anual',  price: 199.00,period: '/ano',  features: ['Tudo do plano Mensal', '2 meses grátis', 'Acesso antecipado a lançamentos'] },
];

window.SUB_LOGS = [
  { who: 'Ana Beatriz', action: 'concedeu assinatura Anual a Carlos Henrique', when: 'há 2 horas', tone: 'live' },
  { who: 'Sistema', action: 'confirmou pagamento de R$ 199,00 (CREDIT_CARD)', when: 'há 3 horas', tone: 'live' },
  { who: 'Leitor Demo', action: 'cancelou a assinatura Mensal', when: 'ontem', tone: 'ended' },
  { who: 'Sistema', action: 'registrou falha de pagamento de R$ 19,90 (PIX)', when: 'ontem', tone: 'ended' },
  { who: 'Ana Beatriz', action: 'processou reembolso de R$ 199,00', when: 'há 2 dias', tone: 'open' },
  { who: 'Sistema', action: 'expirou a assinatura Mensal de Tomás Nogueira', when: 'há 3 dias', tone: 'soon' },
];
