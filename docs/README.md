# Documentação do Toonlira

Este diretório concentra os guias normativos e os documentos de apoio do
projeto. O README da raiz apresenta a visão geral; os READMEs de cada módulo
contêm instruções operacionais específicas.

## Guias normativos

| Documento                                            | Quando consultar                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`architecture.md`](architecture.md)                 | Antes de alterar domínio, use cases, controllers, integrações, respostas da API ou persistência poliglota |
| [`orm-persistence.md`](orm-persistence.md)           | Antes de modificar JPA, MongoDB, repositories, transações, paginação ou índices                           |
| [`database-modeling.md`](database-modeling.md)       | Antes de criar ou alterar entidades persistidas, migrations, colunas, FKs ou coleções                     |
| [`source-layout.md`](source-layout.md)               | Antes de criar ou mover módulos do frontend FSD                                                           |
| [`clean-code.md`](clean-code.md)                     | Para naming, estilo, imports, Tailwind, i18n e convenções gerais                                          |
| [`testing.md`](testing.md)                           | Antes de escrever ou alterar testes                                                                       |
| [`i18n-guide.md`](i18n-guide.md)                     | Para UI multilíngue, conteúdo localizado e labels de domínio                                              |
| [`documentation-policy.md`](documentation-policy.md) | Para decidir quais documentos atualizar em cada tipo de mudança                                           |
| [`ai-memory.md`](ai-memory.md)                       | Para retomar trabalho entre agentes e decidir o que salvar (ou não) na memória compartilhada              |

## Operação e evolução

| Documento                                                                                                | Conteúdo                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`deployment-plan.md`](deployment-plan.md)                                                               | Plano de deploy, infraestrutura, CI/CD e segurança                                                |
| [Primeira página real](translation-real-page-2026-10-24.md) | Vision/Translation reais capturados, renderer isolado, integridade e limites; aquisição mobile pendente |
| [`translation-validation-2026-10-24.md`](translation-validation-2026-10-24.md)                              | Gates recuperados e validação de uma página sintética na cloud, com artefatos e retirada verificados |
| [`volatile-processing-architecture.md`](volatile-processing-architecture.md) | Arquitetura vigente do processamento volátil do gateway de tradução |
| [`translation-subscription-quotas.md`](translation-subscription-quotas.md) | Requisitos e precificação das cotas de tradução nas assinaturas |
| [`tech-debt.md`](tech-debt.md) | Resumo ativo e histórico das dívidas `DT-NN`; fonte única para pendências técnicas |

## Documentação que mora no módulo

- [`../api/apps/core/docs/behavior-analytics.md`](../api/apps/core/docs/behavior-analytics.md):
  política, thresholds e contratos da telemetria privada.
- [`../api/apps/translation-gateway/docs/`](../api/apps/translation-gateway/docs):
  plano do gateway de tradução, progresso e demais registros do módulo.

## Documentação por módulo

- [`../api/README.md`](../api/README.md): backend e jobs.
- [`../api/apps/core/README.md`](../api/apps/core/README.md): API principal.
- [`../web/README.md`](../web/README.md): workspace frontend.
- [`../web/apps/toonlira/README.md`](../web/apps/toonlira/README.md): aplicação web principal.
- [`../web/apps/landing-page/README.md`](../web/apps/landing-page/README.md): landing page.
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
