# Analytics comportamental privado

`behavior_events` é a fonte privada de telemetria autenticada. Ela não alimenta
o feed social e não substitui `activity_events`, `view_history`,
`user_chapter_reads` ou `reading_progress`.

## Consentimento e retenção

- `behaviorAnalyticsEnabled` é independente da visibilidade social e inicia
  habilitado, exceto para perfis migrados de `DO_NOT_TRACK`.
- `DO_NOT_TRACK` desabilita analytics e limpa as quatro coleções de histórico.
  Sair desse modo não reativa o consentimento.
- Eventos brutos expiram em 180 dias por padrão
  (`app.behavior-analytics.retention-days`) pelo índice TTL em `expiresAt`.
- O servidor deriva `userId` da autenticação. O contrato não aceita esse campo
  no payload do cliente.

## Thresholds

| Sinal | Valor padrão |
|---|---:|
| Visualização qualificada de título | 15 s visíveis |
| Bounce de título | 2–15 s visíveis |
| Início de sessão de capítulo | 10 s visíveis |
| Conclusão de capítulo | 90% |
| Lote web | 100 eventos |

`GET /api/behavior-events/config` entrega os valores efetivos e informa se a
coleta está habilitada para a conta.

## Inventário implementado

Eventos canônicos do backend, publicados depois do commit:

- `LIBRARY_ITEM_ADDED`, `LIBRARY_ITEM_REMOVED`, `LIBRARY_LIST_CHANGED`;
- `PROFILE_RECOMMENDATION_ADDED`, `PROFILE_RECOMMENDATION_REMOVED`,
  `PROFILE_RECOMMENDATION_REORDERED`;
- `SUBSCRIPTION_CREATED` e `CHAPTER_COMPLETED`.

Eventos de experiência da web:

- `TITLE_VIEW_QUALIFIED` e `TITLE_VIEW_BOUNCE`, contando apenas foreground e
  ignorando unload técnico;
- `CHAPTER_SESSION_STARTED`, `CHAPTER_PROGRESS_CHECKPOINT`,
  `CHAPTER_SESSION_COMPLETED` e `CHAPTER_SESSION_PARTIAL`;
- `SEARCH_PERFORMED`, `SEARCH_NO_RESULTS`, `SEARCH_RESULT_CLICKED`;
- `STORE_OUTBOUND_CLICK`.

A web persiste a fila em IndexedDB, usa IDs estáveis por tentativa, envia lotes
com backoff e jitter, retoma online e coordena flush entre abas com
`BroadcastChannel`. O servidor trata `_id` duplicado como sucesso.

## Persistência e contratos

- MongoDB: `behavior_events`, documento `schemaVersion=1`; índices de usuário,
  tipo, título, sessão e TTL criados pela Mongock V024.
- PostgreSQL: `user_profile_settings.behavior_analytics_enabled`, criada pela
  Flyway V43.
- Ingestão: `POST /api/behavior-events/batch`.
- Limpeza sem alterar consentimento: `DELETE /api/users/me/behavior-history`.
- Exportação JSON: `GET /api/users/me/data-export`; inclui conta, preferências,
  biblioteca, recomendações, progresso e históricos privados.

## Lacunas registradas

Ainda não há sinal confiável para abandono inferido após a janela offline,
deduplicação semântica forte entre abas, origem completa de toda navegação,
filtros estruturados de catálogo, troca/retorno/releitura de capítulo. Esses
itens exigem um coordenador de sessão com deadline persistido e um contrato de
navegação comum; não devem ser inferidos de reload, falha de rede ou montagem
do StrictMode. Ver DT-67.

Android/iOS, impressão/ocultação de recomendações algorítmicas, compra externa
e estados intermediários de assinatura permanecem fora do inventário porque os
produtos atuais não fornecem ações ou confirmações canônicas para esses sinais.
