# Documentação do Manga Reader

Este diretório concentra os guias normativos e os documentos de apoio do
projeto. O README da raiz apresenta a visão geral; os READMEs de cada módulo
contêm instruções operacionais específicas.

## Guias normativos

| Documento | Quando consultar |
|---|---|
| [`architecture.md`](architecture.md) | Antes de alterar domínio, use cases, controllers, integrações, respostas da API ou persistência poliglota |
| [`orm-persistence.md`](orm-persistence.md) | Antes de modificar JPA, MongoDB, repositories, transações, paginação ou índices |
| [`database-modeling.md`](database-modeling.md) | Antes de criar ou alterar entidades persistidas, migrations, colunas, FKs ou coleções |
| [`source-layout.md`](source-layout.md) | Antes de criar ou mover módulos do frontend FSD |
| [`clean-code.md`](clean-code.md) | Para naming, estilo, imports, Tailwind, i18n e convenções gerais |
| [`testing.md`](testing.md) | Antes de escrever ou alterar testes |
| [`i18n-guide.md`](i18n-guide.md) | Para UI multilíngue, conteúdo localizado e labels de domínio |
| [`documentation-policy.md`](documentation-policy.md) | Para decidir quais documentos atualizar em cada tipo de mudança |

## Operação e evolução

| Documento | Conteúdo |
|---|---|
| [`deployment-plan.md`](deployment-plan.md) | Plano de deploy, infraestrutura, CI/CD e segurança |
| [`behavior-analytics.md`](behavior-analytics.md) | Política, thresholds, contratos e inventário da telemetria privada |
| [`tech-debt.md`](tech-debt.md) | Resumo ativo e histórico das dívidas `DT-NN`; fonte única para pendências técnicas |
| [`audits/2026-07-18-mangahost-config-audit.md`](audits/2026-07-18-mangahost-config-audit.md) | Auditoria completa de configurações do produto, clientes, persistência e operação em 18/07/2026 |
| [`audits/2026-07-18-mangahost-config-inventory.csv`](audits/2026-07-18-mangahost-config-inventory.csv) | Inventário filtrável, uma linha por configuração auditada |
| [`audits/2026-07-18-mangahost-remediation-matrix.md`](audits/2026-07-18-mangahost-remediation-matrix.md) | Estado pós-remediação A-01–A-12, provas dinâmicas, restauração e gates finais |

## Relatórios e referências

- [`comments-system-mapping.md`](comments-system-mapping.md): mapeamento do
  sistema de comentários.
- [`comments-unification-report.md`](comments-unification-report.md): relatório
  da unificação de comentários.
- [`audits/2026-07-02-project-audit.md`](audits/2026-07-02-project-audit.md):
  auditoria histórica datada. Não representa automaticamente o estado atual
  dos gates.
- [`audits/2026-07-18-mangahost-config-audit.md`](audits/2026-07-18-mangahost-config-audit.md):
  fotografia anterior à remediação das configurações do Mangahost em 18/07/2026;
  o adendo, a matriz e o CSV associado registram o estado final verificado.
- [`plans/`](plans): planos históricos de implementação. Um plano concluído não
  substitui o código ou a configuração como fonte de verdade.

## Documentação por módulo

- [`../api/README.md`](../api/README.md): backend e jobs.
- [`../api/core/README.md`](../api/core/README.md): API principal.
- [`../web/README.md`](../web/README.md): workspace frontend.
- [`../web/manga-reader/README.md`](../web/manga-reader/README.md): aplicação web principal.
- [`../web/landing-page/README.md`](../web/landing-page/README.md): landing page.
- [`../mobile/README.md`](../mobile/README.md): aplicativo mobile.

## Regra de manutenção

Documente um comportamento no nível que é responsável por ele:

- visão do produto e primeiro uso no README raiz;
- comandos e configuração no README do módulo;
- decisões e invariantes nos guias normativos;
- contrato REST vivo no Swagger/OpenAPI;
- pendências no registro de dívida técnica.

Evite duplicar contagens, listas extensas de endpoints ou estados transitórios em
vários arquivos.
