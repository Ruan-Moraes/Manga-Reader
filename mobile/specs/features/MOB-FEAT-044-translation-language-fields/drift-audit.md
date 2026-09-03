# Drift audit — MOB-FEAT-044

Data: 2026-08-31.

- Implementação auditada: working-tree sha256:38172ac139f24be05ddf591a77830ea02b9586b8729bba5be6c131da60bffe58
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
