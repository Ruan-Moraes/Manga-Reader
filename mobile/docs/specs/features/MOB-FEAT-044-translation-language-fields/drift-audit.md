# Drift audit — MOB-FEAT-044

Data: 2026-08-31.

- Implementação auditada: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Status: `verification-pending`

## Resultado

Spec corresponde ao plano explicitamente aprovado pelo usuário. Dois campos
substituem os ChoiceGroup; a folha e as regras de idioma são reutilizadas.
Labels, nota e recomendação existem nos três locales. Nenhuma migration,
dependência, API, controller ou navegação foi alterada.

Coverage preserva os contratos anteriores e adiciona referências individuais
aos critérios 044 nos componentes, testes e locales. Capturas e relatórios têm
classificação evidence. Cada AC possui uma linha própria em tasks e review.
TASK-004 e TASK-005 ficam abertas para verificações nativas/gate global.

Não foram alterados os checksums de outras features. O checksum desta feature
representa o snapshot completo compartilhado; não implica aprovação de mudanças
concorrentes nem substitui evidência nativa ausente.

## Contadores locais

- Arquivos runtime novos sem mapa: 0 (nenhum arquivo runtime criado).
- Critérios sem evidência classificada: 0.
- Divergências de intenção detectadas no escopo 044: 0.
- Verificações abertas: 2 tasks.
- Pendência global preexistente: checksums de 20 reviews históricas.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
