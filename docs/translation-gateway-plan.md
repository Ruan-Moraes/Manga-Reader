# Plano arquitetural do gateway de tradução

O desenho vigente, aprovado por Ruan em 2026-11-01, é processamento volátil
em memória com entrega na mesma sessão autenticada. O aplicativo conserva o
original e persiste o resultado no aparelho após validar bytes, hashes,
dimensões, idiomas e vínculo da tentativa.

A referência técnica é [processamento volátil](volatile-processing-architecture.md).
Os contratos de produto estão nas [specs mobile](../mobile/docs/specs/registry.md),
017–021, e na [DEC-008](../mobile/docs/decisions/MOB-DEC-008-volatile-processing.md).
A [versão anterior](translation-gateway-plan-pre-volatile-2026-11-01.md) é
histórica e não comprova os critérios do novo transporte.

## Fronteiras e comportamento

- Serviço Spring Boot independente da Core; identidade anônima e bearer curto,
  sem credenciais de providers no cliente.
- Somente a primeira página ordenada do projeto neste slice.
- Entrada binária limitada, OCR Vision online regional US com bytes inline,
  tradução contextual síncrona global e renderização WebP lossless/exact.
- Original, raster, OCR, tradução, manifesto e saída permanecem em memória
  no servidor. A resposta direta é limitada e usa `Cache-Control: no-store`.
- Não há download posterior ou recuperação remota de conteúdo. Interromper
  a conexão local não comprova cancelamento de um provider em andamento.
- Recibo operacional durável antes dos providers protege contra execução
  duplicada. A chave UUIDv7 tem validade absoluta de sete dias; consulta
  autenticada retorna apenas metadados da instalação proprietária.
- Logs operacionais sanitizados permanecem disponíveis para segurança e
  auditoria; não recebem conteúdo, tokens ou mensagens brutas dos providers.
- O resultado só fica `READY` após validação e commit no aparelho. Nova execução
  após perda da entrega exige decisão explícita, nova tentativa/chave e aviso
  de possível novo custo.

## Estado e verificação

A arquitetura está em implementação e permanece desabilitada por padrão.
Provas históricas de armazenamento não aprovam o fluxo atual. A matriz nativa
local é evidência do renderer; integração de sessão, qualidade dos providers,
ambiente alvo e aquisição no aparelho têm verificação própria.

O [README do módulo](../api/apps/translation-gateway/README.md) concentra
configuração, execução e testes. Mudanças operacionais de recursos antigos
exigem inventário e encerramento próprios; alterar código não comprova exclusão
retroativa de dados existentes.
