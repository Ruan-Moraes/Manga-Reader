---
name: mobile-performance
description: Analise e preserve performance no Manga Reader mobile antes de novas funcionalidades ou alterações de componentes e fluxos, durante reviews e refatorações, após implementar e ao investigar lentidão, travamentos ou consumo crescente. Use somente no mobile; ajuste a profundidade ao impacto real da tarefa.
---

# Performance mobile

Leia [AGENTS mobile](../../../AGENTS.md) e a decisão normativa
[MOB-DEC-007](../../../docs/decisions/MOB-DEC-007-mobile-performance.md).
A consulta é obrigatória nos gatilhos da descrição; não exige auditoria integral
em tarefas pequenas. A skill não autoriza otimização nem alteração adicional.

## Procedimento

1. Localize os caminhos afetados no [coverage](../../../docs/specs/coverage.json)
   e no [registry](../../../docs/specs/registry.md). Leia AC/OBS e gates antes de
   propor mudança. Código sem contrato exige o fluxo SDD; não aprove specs pela IA.
2. Entenda o estado atual, incluindo alterações locais. Consulte a
   [auditoria](../../../docs/active/performance-audit.md) só nas áreas relevantes;
   confira hashes/versões antes de reutilizar suas conclusões.
3. Classifique cada ponto: confirmado estaticamente, medido ou hipótese. Defina
   gatilho, volume, impacto observável e prova que falta. Se não houver nexo
   plausível de runtime, registre não aplicável e prossiga com a tarefa original.
4. Aplique os checklists antes/depois da decisão. Para medição use o
   [protocolo](../../../docs/active/performance-evidence/measurement-protocol.md).
   Compare cenário idêntico, registre variabilidade e diferencie RN de Node/Jest.
5. Recomende a menor mudança sustentada pela evidência. Não aplique memoização
   generalizada, cache ou paralelismo por precaução; preserve função, qualidade,
   consentimento, atomicidade, recuperação e identidade de sessão.
6. Após implementar, execute validações proporcionais e `pnpm check`; registre
   evidência, riscos e pendências. Não declare ganho ou ausência de regressão
   se não mediu. Mantenha verification-pending quando exigido pelo SDD.

## Resultado esperado

Entregue problema/local, classificação/evidência, impacto observado versus potencial,
recomendação, prioridade justificada, risco/dependência e teste/medição de aceite.
Sem evidência suficiente, proponha investigação ou encerre como não aplicável,
sem inventar defeito. Atualize diagnóstico/backlog apenas quando necessário.

Em auditoria documental, não altere runtime, testes do produto, schema ou dependências.
Em tarefa funcional autorizada, siga o escopo recebido e os contratos existentes;
esta skill não é um pedido adicional de confirmação nem substitui o fluxo SDD.
