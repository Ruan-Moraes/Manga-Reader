# Trending Aggregator

Job diário que calcula quais obras estão crescendo usando leituras (45%), adições à biblioteca (25%), avaliações (15%), comentários (10%) e lançamentos (5%). Compara janelas consecutivas de 1, 7 e 30 dias, suaviza amostras pequenas e persiste o ranking reconstruível em `title_trend_daily` no MongoDB.

- Porta: `8083`
- Agenda padrão: diariamente às `03:15` em `America/Sao_Paulo`
- Configuração: `trending.schedule.cron`, `trending.zone`, `trending.retention-days` e `trending.weights.*`
- Execução manual: `POST /admin/reconcile` com `X-Admin-Token`
- A API pública apenas lê o resultado em `GET /api/trending?window=DAY|WEEK|MONTH&ranking=SCORE|READS|REVIEWS|LIBRARY_ADDS`; cada item inclui volume e crescimento geral e por sinal.
- Seed local: `trending.seed.enabled=true` cria snapshots para até 12 títulos reais somente quando a coleção está vazia; produção força `false`.
- As janelas usam dias UTC completos e adjacentes; a agenda em `America/Sao_Paulo` apenas define quando o cálculo é disparado.
- Snapshots são reconstruíveis e expiram após 90 dias por padrão.
