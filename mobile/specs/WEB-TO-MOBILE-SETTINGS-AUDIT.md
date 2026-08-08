# Auditoria de configurações Web → Mobile

Documento informativo. Esta auditoria registra a origem das decisões das Target Specs `MOB-FEAT-001` a `MOB-FEAT-008`; ela não cria requisitos, não transforma defeitos Web em intenção futura e não substitui os `AC-*` normativos.

## Método e classificação

Foram inspecionados contratos, estado, UI, estilos, clientes HTTP, consumidores e testes da Web, além dos DTOs/value objects/endpoints correspondentes da Core e dos baselines atuais do Mobile.

- `functional`: o resultado é observável e possui consumidor real.
- `partial`: o controle existe, mas seu efeito é incompleto ou inconsistente.
- `placeholder`: a superfície anuncia uma capacidade sem implementação correspondente.
- `web-only`: o comportamento depende do navegador e precisa ser adaptado ou excluído no Mobile.

## Fontes auditadas

| Área                       | Fontes principais da Web/Core                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Modelo e defaults          | `entities/user/model/userSettings.types.ts`; Core `UserSettings.java`, `UpdateUserSettingsRequest.java`, `UserSettingsResponse.java` |
| Persistência e aplicação   | `entities/user/lib/accessibility.ts`; `entities/user/model/useUserSettings.tsx`; `app/providers/UserSettingsHydrator.tsx`            |
| Sync                       | `pages/settings/model/useSettingsState.tsx`; `useSettingsSync.ts`; `entities/user/api/userService.ts`                                |
| Aparência e acessibilidade | `AppearanceTab.tsx`; `AccessibilityTab.tsx`; `styles/index.css`; `ThemePreferenceMenu.tsx`                                           |
| Idioma e região            | `i18n/config.ts`; `i18n/locales/README.md`; `useInterfaceLang.ts`; `LanguageTab.tsx`; interceptors HTTP                              |
| Idiomas de conteúdo        | `useReadingLangs.ts`; `useContentLocales.tsx`; endpoints Core `/users/me/content-locales`                                            |
| Leitor                     | `ReaderTab.tsx`; `pages/chapter/model/useChapterReader.ts`; `useReaderPages.ts`; `ReadingArea.tsx`                                   |
| Privacidade                | `PrivacidadeTab.tsx`; modelos de perfil; endpoint Core `/users/me/privacy`                                                           |
| Dados                      | `DataTab.tsx`; `queryCache.ts`; export e histórico no `userService.ts`; Core `UserDataExportController`                              |
| Navegação e Sobre          | `SystemSettings.tsx`; `SettingsAboutTab.tsx`; layout/footer/tab bar Web                                                              |
| Evidências                 | `accessibility.test.ts`; `SystemSettings.test.tsx`; testes do reader, menus, serviços e controllers Core                             |

Os paths de componentes da tabela são relativos a `web/manga-reader/src/pages/settings/ui/parts/` quando não qualificados.

## Mapa configuração → contrato mobile

| Configuração/comportamento Web                    | Estado Web                | Observação auditada                                                       | Destino normativo                            | Adaptação Mobile                                                        |
| ------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Envelope `reader/appearance/locale/accessibility` | functional                | Core valida grupos integrais, enums e ranges                              | `MOB-FEAT-001/AC-001`, `AC-012`              | Modelo versionado e normalização por campo                              |
| Cache `mr.settings.v1` e merge com defaults       | functional                | localStorage parcial; erro de leitura/gravação cai silenciosamente        | `MOB-FEAT-001/AC-001` a `AC-003`             | Storage nativo, hidratação finita e diagnóstico recuperável             |
| Migração de `reader:prefs`                        | functional                | Migração Web one-shot                                                     | `MOB-FEAT-001/AC-001`                        | Política genérica de migrações versionadas; não migrar localStorage Web |
| Hidratação autenticada                            | functional                | Core substitui estado local Web                                           | `MOB-FEAT-001/AC-004`, `AC-009`, `AC-010`    | Core prevalece no login; guest não é promovido automaticamente          |
| Sync debounce/version/retry/flush                 | functional                | PATCH integral em 400 ms; resposta stale ignorada                         | `MOB-FEAT-001/AC-005` a `AC-008`, `AC-011`   | Mesmo resultado sem depender de eventos/abas do navegador               |
| Sincronização entre abas                          | web-only                  | `storage` e `CustomEvent`                                                 | exclusão justificada                         | Não existe equivalente necessário entre processos mobile                |
| Tema DARK/LIGHT/SYSTEM                            | functional                | Web/Core default DARK; Mobile observado segue o sistema                   | `MOB-FEAT-002/AC-001` a `AC-003`             | Default local `SYSTEM`; preferência autenticada da Core prevalece       |
| Paletas claro/escuro                              | functional                | Tokens semânticos coexistem com exceções CSS                              | `MOB-FEAT-002/AC-004`                        | Resolver único de tokens, sem copiar seletores HTML                     |
| Alto contraste                                    | functional                | Classes específicas por tema; fórum possui workaround próprio             | `MOB-FEAT-002/AC-005`, `AC-013`              | Preferência efetiva = SO ou manual; nenhuma paleta ad hoc por page      |
| Fonte COMPACT/DEFAULT/COMFORTABLE                 | partial                   | Escala altera apenas parte dos textos Web                                 | `MOB-FEAT-002/AC-006`, `AC-007`              | Aplicação semântica global composta com font scale nativo               |
| Densidade COMFORTABLE/COMPACT                     | partial                   | Tokens compactos quase não possuem consumidores reais                     | `MOB-FEAT-002/AC-008`                        | Espaçamento global real, preservando 44 pt iOS/48 dp Android            |
| `animations=false`                                | partial                   | CSS reduz animações, mas timers podem continuar                           | `MOB-FEAT-002/AC-010`, `AC-013`              | Desliga decoração/autoplay e preserva feedback essencial                |
| `reduceMotion` e media query                      | partial                   | Classes e SO não controlam todos os timers                                | `MOB-FEAT-002/AC-009`, `AC-013`              | SO ou opção manual interrompem todo movimento decorativo                |
| UI acessível para aparência                       | functional                | Switches/segmented controls e axe                                         | `MOB-FEAT-002/AC-011`, `AC-012`              | Controles nativos traduzidos, preview e retry                           |
| UI locale pt-BR/en-US/es-ES                       | functional                | Fallback pt-BR; localStorage/navigator                                    | `MOB-FEAT-003/AC-001`, `AC-002`              | Storage e locale do SO; aplicação imediata sem reload                   |
| `Accept-Language` da UI                           | functional                | Header não representa content locales                                     | `MOB-FEAT-003/AC-003`; `MOB-FEAT-004/AC-008` | Manter e testar a separação dos dois eixos                              |
| Reload depois de trocar idioma                    | web-only                  | Settings sinaliza reload; footer não                                      | exclusão justificada                         | Atualização imediata e invalidação seletiva, sem reinício               |
| 19 namespaces Web                                 | functional                | Todos têm três bundles, vários pertencem a páginas inexistentes no Mobile | `MOB-FEAT-003/AC-004`, `AC-005`              | Namespace entra somente com consumidor mobile e paridade trilíngue      |
| Labels de domínio localizadas                     | functional                | API resolve labels; cache varia pelo locale                               | `MOB-FEAT-003/AC-006`                        | Não duplicar labels normativos nos bundles mobile                       |
| Formato de data D_MON/D_M/MON_D                   | functional                | Persistido em settings Core                                               | `MOB-FEAT-003/AC-007`, `AC-009`              | Formatter locale-aware nativo                                           |
| Timezones permitidos                              | functional                | São Paulo, Nova York, Lisboa, Tóquio e UTC                                | `MOB-FEAT-003/AC-008`, `AC-009`              | Mesmo domínio Core e fallback seguro                                    |
| Cadeia autenticada de conteúdo                    | functional                | GET/PATCH, ordenação e refetch                                            | `MOB-FEAT-004/AC-001` a `AC-005`             | Normalizar duplicatas, tags externas e fallback ausente no cliente      |
| `pt-BR` obrigatório                               | partial                   | UI Web impede remoção, Core não garante unicidade/fallback                | `MOB-FEAT-004/AC-003`                        | Invariante explícita e testada no Mobile                                |
| Idiomas de conteúdo guest                         | partial                   | Editor Web aparenta alterar, mas não persiste nem afeta requests          | `MOB-FEAT-004/AC-006`                        | Sem editor falso; derivar UI locale + pt-BR                             |
| Troca de conta/logout da cadeia                   | functional por composição | Depende da identidade/cache                                               | `MOB-FEAT-004/AC-007`, `AC-009`, `AC-010`    | Remover projeção privada antes de fallback/hidratação                   |
| Direções LTR/RTL/WEBTOON                          | functional                | WEBTOON força vertical                                                    | `MOB-FEAT-005/AC-002`                        | Semântica explícita em leitor full-screen nativo                        |
| Modos vertical/paginado/duplo                     | functional                | Consumidos pelo reader Web                                                | `MOB-FEAT-005/AC-001`, `AC-002`              | Páginas ordenadas e navegação acessível                                 |
| Fit/saturação/gap/fundo                           | functional                | Alteram o resultado visual                                                | `MOB-FEAT-005/AC-003`                        | Preferências reais, sem controles decorativos                           |
| Qualidade AUTO/LOW/MEDIUM/HIGH/ORIGINAL           | partial                   | LOW usa thumbnail; demais frequentemente usam a mesma URL                 | `MOB-FEAT-005/AC-004`                        | Só mostrar escolhas ligadas a fontes/políticas distintas                |
| Preload 0..10                                     | partial                   | Atua principalmente no vertical e sem orçamento explícito                 | `MOB-FEAT-005/AC-001`, `AC-008`              | Evidenciar memória/rede e falhar sem perder a página atual              |
| Progresso/retomada/autoMarkRead                   | functional autenticado    | Escrita e conclusão dependem de total conhecido                           | `MOB-FEAT-005/AC-005` a `AC-007`             | Guest sem escrita privada; conta retoma e conclui com total confiável   |
| Rotação e acessibilidade do leitor                | partial                   | Evidência Web não cobre toda matriz                                       | `MOB-FEAT-005/AC-009`                        | Testes nativos de foco, rotação e reflow                                |
| Visibilidade de comentários/biblioteca/histórico  | functional                | Core aceita enum amplo                                                    | `MOB-FEAT-006/AC-001`, `AC-002`              | DNT exposto somente onde sua semântica existe: histórico                |
| DO_NOT_TRACK e analytics                          | functional                | Entrada/saída limpa dados; analytics=true é inválido sob DNT              | `MOB-FEAT-006/AC-003` a `AC-005`             | Confirmação, invariantes e nenhum opt-in implícito                      |
| Conteúdo adulto BLUR/HIDE/SHOW                    | functional                | Preferência limpa caches relacionados                                     | `MOB-FEAT-006/AC-006`, `AC-008`              | Default BLUR e aplicação consistente em toda superfície consumidora     |
| Privacy optimistic update                         | functional                | Rollback em falha                                                         | `MOB-FEAT-006/AC-007`, `AC-009`              | Rollback e isolamento por sessão explícitos                             |
| Limpar cache                                      | functional                | Query/CacheStorage Web                                                    | `MOB-FEAT-007/AC-001`, `AC-002`              | Adaptador nativo preserva sessão e preferências                         |
| Uso/quota de armazenamento                        | web-only                  | `navigator.storage.estimate`                                              | `MOB-FEAT-007/AC-007`                        | Exibir somente se a plataforma fornecer medida confiável                |
| Exportar dados                                    | functional                | Download Blob via DOM                                                     | `MOB-FEAT-007/AC-003`, `AC-004`              | Arquivo temporário + share/save nativo, com limpeza/cancelamento        |
| Limpar histórico rastreado                        | functional autenticado    | Botão guest Web chama endpoint protegido e tende a falhar                 | `MOB-FEAT-007/AC-005`, `AC-006`, `AC-008`    | Confirmação; guest recebe estado indisponível/CTA de login              |
| Importar dados                                    | placeholder               | Botão permanentemente desabilitado                                        | exclusão em `MOB-FEAT-007`                   | Não criar controle mobile até existir contrato aprovado                 |
| Rota Settings com seis tabs                       | functional                | Tabs responsivas e query `?tab=`                                          | `MOB-FEAT-008/AC-001` a `AC-003`             | Índice + subrotas nativas + deep links determinísticos                  |
| Meta guest/conta e banners de sync                | functional                | Estado local/syncing/synced/error                                         | `MOB-FEAT-008/AC-004` a `AC-006`, `AC-009`   | Estado verdadeiro, retry e nenhuma UI antes da hidratação               |
| Sobre/versão/links                                | partial                   | Versão hardcoded e links genéricos                                        | `MOB-FEAT-008/AC-007`                        | Versão da configuração do app e links mobile válidos                    |
| Tabela de atalhos                                 | partial/web-only          | Vários atalhos anunciados não têm implementação                           | exclusão justificada                         | Não portar atalhos de teclado para a navegação nativa                   |
| Footer/newsletter/app links                       | placeholder/web-only      | Newsletter sem callback no Root; app links `#`                            | exclusão justificada                         | Nenhum AC mobile                                                        |
| Notificações                                      | placeholder               | Rota protegida e empty state, sem API/preferences/push                    | capacidade não especificável                 | Nenhuma Target Spec até existir contrato de produto/Core                |

## Arquitetura futura consolidada

- `shared`: storage, locale, aparência/movimento e compartilhamento agnósticos ao domínio.
- `entities`: modelos consultáveis de configurações, capítulo e privacidade.
- `features`: ações de alterar/sincronizar preferências, privacidade e dados.
- `widgets`/`pages`: composição do leitor e das superfícies de settings, sem chamadas de domínio diretas.
- `app`: providers, gates e rotas usando apenas APIs públicas dos slices.

A localização atual de lógica em `pages/settings/model` na Web é evidência de comportamento, não layout arquitetural a copiar.

## Resultado da reconciliação

- Toda configuração funcional auditada aponta para ao menos um `AC-*`.
- Todo comportamento parcial foi reformulado como resultado mobile verificável ou excluído explicitamente.
- Todo placeholder ou mecanismo exclusivamente Web possui exclusão justificada.
- Nenhuma funcionalidade de notificações foi inferida a partir de constantes, rota vazia ou ícone sem ação.
- As oito Target Specs permanecem `draft`; nenhuma possui `tasks.md` ou código runtime.
