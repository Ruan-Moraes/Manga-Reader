---
id: MOB-DEC-008
type: decision
title: Processamento volátil e armazenamento de conteúdo no aparelho
status: accepted
created: 2026-11-01
updated: 2026-11-01
supersedes: []
superseded_by: []
---

# MOB-DEC-008 — Processamento volátil e conteúdo no aparelho

## Contexto

O desenho anterior de MOB-FEAT-017..021 conservava conteúdo remoto para executar
etapas assíncronas e permitir aquisição posterior. Ruan alterou explicitamente
a intenção: o servidor deve intermediar OCR, tradução e renderização em memória
e devolver o resultado ao aplicativo, que mantém original e resultado no aparelho.

Ruan aprovou a implementação dessa arquitetura e pediu substituir as
especificações anteriores pelo novo requisito. Logs operacionais padrão para
auditoria e segurança continuam presentes, com dados minimizados.

## Decisão

- Original, raster, regiões OCR, tradução, imagem final e manifesto não são
  persistidos pelo servidor, seus proxies ou o transporte entre etapas.
- Processamento e entrega autenticada ocorrem dentro da sessão. Não existe
  aquisição posterior de conteúdo após encerramento ou recuperação em restart.
- OCR online usa bytes inline; tradução usa operação síncrona. A política
  publicada distingue o operador dos subprocessadores e suas práticas.
- Recibos de operação/idempotência e logs sanitizados podem ser duráveis.
  Replays e consultas de recibo não recuperam conteúdo nem repetem providers.
- Chaves de idempotência são UUIDv7 geradas com horário do servidor fornecido
  pelas capabilities válidas. O timestamp não é renovado por consulta/restart;
  a validade termina em sete dias absolutos desde esse timestamp.
- Após vencimento, execução é recusada antes de qualquer provider e consulta de
  recibo retorna ausência (`404`), mesmo que ainda exista uma linha no banco.
  Remover fisicamente o recibo não ressuscita nem renova a chave.
- Recibos só são consultáveis sob chave ativa. Tornam-se candidatos à remoção
  física sete dias após seu `created_at`, mas a limpeza também exige chave
  vencida: preservar o recibo enquanto a chave estiver ativa, inclusive dentro
  da tolerância de timestamp futuro aceita pelo servidor. Essa conjunção impede
  que uma remoção baseada apenas na idade do recibo reabra execução paga.
- A limpeza ocorre em lotes e depende da disponibilidade do banco, sem promessa
  de exclusão física imediata no prazo da chave. Logs operacionais seguem
  política própria, separada dos recibos.
- Nova execução após perda da resposta ou vencimento exige ação explícita,
  nova tentativa/chave com capabilities válidas e comunicação do possível novo
  custo. Não há retry pago automático ou renovação oculta de tentativa antiga.
- O aparelho valida integralmente a resposta antes de efetivar resultado e
  regiões locais e abrir o leitor. Dados locais íntegros permanecem offline.
- No estado local, a resposta direta admite `DRAFT → PROCESSING`. Falha local
  comprovada admite `DRAFT → FAILED` somente na página/tentativa, sem tornar
  automaticamente o projeto `FAILED`. Nova execução explícita da primeira
  página admite `FAILED → PROCESSING` mesmo com projeto já `PROCESSING`.
  Preservar `READY`/`CANCELLED` da página e do projeto e não reiniciar outras
  páginas. A 016 incorpora somente esse delta de transições; nenhum novo estado,
  enum SQL, coluna ou migration é necessário. Não simular fila durável e não
  marcar `READY` antes do commit local validado.
- Projetos legados já `QUEUED` são preservados como histórico. Após interrupção
  local da tentativa antiga, uma nova execução explicitamente confirmada da
  primeira página `FAILED` pode realizar `QUEUED → PROCESSING` na aceitação
  direta, conforme a 016. Isso não cria fila durável nova nem confirma
  cancelamento remoto da operação antiga.
- Interromper o transporte local não comprova cancelamento de chamada externa.
- Nova versão de disclosure e aceite são necessários. Os termos exigem direitos
  ou autorização sobre o conteúdo enviado sem prometer exoneração do operador.
- Preservar provas, logs e registros históricos; o contrato corrente substitui
  as regras antigas de conteúdo. Aceites antigos não se transferem ao novo fluxo.

## Alternativas consideradas

- Continuar com persistência remota e limite de retenção: rejeitado pela nova
  direção explícita de minimização de conteúdo.
- Manter buffers em arquivos temporários ou em volume volátil: não atende à
  exigência de conteúdo em memória e ausência de arquivos de mídia do servidor.
- Recuperar conteúdo após restart: incompatível com a ausência de persistência;
  a consulta conserva somente recibos operacionais.
- Repetir automaticamente uma tentativa ambígua: pode duplicar consumo pago e
  contradiz a exigência de nova execução explícita.

## Consequências

- Revisões atuais de 017..021 substituem o conteúdo normativo anterior,
  preservando IDs AC para rastreabilidade e registrando evidências obsoletas.
- A 017 está em execução. As etapas dependentes voltam a `approved/blocked`
  até sua dependência atual estar executada/`verification-pending`; planos antigos
  ficam arquivados, sem tasks ativas atravessando o gate bloqueado.
- A autorização de continuidade permite abertura sequencial dos gates quando
  houver evidência real de prontidão. Falta de implementação não é verificação
  pendente. O backend permanece fora do workflow SDD mobile.
- Provas novas devem cobrir ausência de gravação, limites, idempotência,
  interrupção, encerramento, retorno tardio, entrega e commit no aparelho.
- Comparação e preservação de algoritmos já exercitados são permitidas; sua
  integração ao novo ciclo de vida precisa de revalidação específica.
- Antes de operação pública, infraestrutura deve desabilitar swap, dumps e
  captura de corpos por proxy/APM. A limpeza de buffers não promete apagamento
  físico universal da memória.

## Relações

- [Arquitetura e plano de dados do gateway](../../../docs/volatile-processing-architecture.md).
- MOB-FEAT-016, limitada ao delta da máquina de estados; MOB-FEAT-017,
  MOB-FEAT-018, MOB-FEAT-019, MOB-FEAT-020 e MOB-FEAT-021.
- MOB-DEC-001/003: workflow, integridade da evidência e gates permanecem válidos.
- Aprovação: Ruan Moraes, nesta conversa, em 2026-11-01; não equivale a deploy,
  custo de provider ou aprovação técnica de implementação.
