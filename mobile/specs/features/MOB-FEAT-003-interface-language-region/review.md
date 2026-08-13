# Review — MOB-FEAT-003

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:2a9c4a85c0b28420394a6cf36082e65787410c03624e1609fc95423e27d42a37
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-001` (`implemented`)
- Verdict: `approved`

## Findings

Nenhum finding aberto.

Os findings das passagens anteriores foram resolvidos:

1. Formatadores usam o idioma efetivo do i18n por padrão e possuem evidência sem locale explícito.
2. Consumidores React montados trocam de idioma sem remontagem e a seleção persiste.
3. `setLanguage` atualiza o i18n antes de publicar o store, eliminando a janela entre invalidação e `Accept-Language`.
4. Os cinco timezones, a virada de dia e o fallback excepcional têm testes.
5. O leitor público apresenta literalmente o título localizado recebido da Core, sem dicionário paralelo ou wrapper sem comportamento.
6. A integração de AC-010 combina UI espanhola, `Accept-Language: es-ES` e a cadeia autenticada independente `['en-US','pt-BR']`; por contrato, a cadeia permanece na conta da Core e não é duplicada em header ou params pelo cliente base.
7. Tasks, shell FSD, coverage, baselines e gates foram reconciliados.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                             | Resultado |
| -------- | ------------ | ------------------------------------------------------------------------------------------------ | --------- |
| AC-001   | sim          | normalização, hidratação válida/inválida e controles limitados aos três idiomas                  | pass      |
| AC-002   | sim          | consumidores React montados mudam de idioma e nova hidratação recupera a seleção                 | pass      |
| AC-003   | sim          | request comum, auth e refresh usam o locale efetivo; ordering de `setLanguage` foi verificada    | pass      |
| AC-004   | sim          | query real do leitor declara metadata locale-dependent; invalidator preserva estado independente | pass      |
| AC-005   | sim          | paridade trilíngue e consumidor por namespace são gates automatizados                            | pass      |
| AC-006   | sim          | leitor apresenta o título localizado retornado pela Core literalmente                            | pass      |
| AC-007   | sim          | três formatos, ano e locale ativo possuem testes                                                 | pass      |
| AC-008   | sim          | cinco timezones, virada de dia, valor inválido e fallback excepcional possuem testes             | pass      |
| AC-009   | sim          | efeito local, PATCH de `locale`, pending, erro e retry possuem teste de integração               | pass      |
| AC-010   | sim          | integração mantém UI/header espanhóis e cadeia autenticada independente na Core                  | pass      |

## Cobertura e drift

| Indicador                       | Resultado |
| ------------------------------- | --------: |
| `mismatch`                      |         0 |
| `undocumented`                  |         0 |
| arquivos runtime descobertos    |         0 |
| lacunas normativas de evidência |         0 |

- `specs:check` não encontrou caminhos obsoletos ou referências desconhecidas.
- Arquivos de locale, controles, leitor, widget `application-shell` e testes estão ligados aos ACs correspondentes em `coverage.json`.
- A composição global em `src/application` está reconciliada no registry, coverage, baseline e relatório.
- Steiger confirma dependências FSD descendentes e APIs públicas dos slices, sem novas exceções ou regras desabilitadas.
- MOB-BASE-003 permanece coerente; AC-001 a AC-010 estão sem drift funcional.

## Gates

| Comando                    | Resultado                         |
| -------------------------- | --------------------------------- |
| `CI=true pnpm specs:check` | pass — ver saída corrente do gate |
| `pnpm typecheck`           | pass                              |
| `pnpm lint`                | pass                              |
| `pnpm lint:fsd`            | pass — nenhum problema FSD        |
| `pnpm format:check`        | pass                              |
| `CI=true pnpm test:ci`     | pass — ver saída corrente do gate |
| `CI=true pnpm check`       | pass ponta a ponta                |

## Mudanças fora da spec

- Os controles de idioma e região são compostos pelo widget de shell na tela de perfil existente. Isso não cria a navegação/subrotas reservadas a MOB-FEAT-008 e funciona como composição provisória até aquela feature.
- Alterações simultâneas de aparência, privacidade e controles de dados pertencem às respectivas Target Specs e não foram usadas como evidência desta feature.

## Conclusão

O gate estava aberto, MOB-FEAT-001 estava implementada antes do planejamento, todos os AC-001 a AC-010 possuem implementação e evidência proporcionais ao risco, a cobertura arquivo→spec está completa e o drift está zero a zero. `CI=true pnpm check` passa integralmente. O verdict é `approved`; MOB-FEAT-003 pode seguir para marcação `implemented` e desbloqueio das dependências subsequentes conforme a política SDD.
