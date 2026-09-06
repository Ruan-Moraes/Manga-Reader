# Evidência visual — MOB-FEAT-011

Auditoria executada em 2026-08-09 no simulador iPhone 17 com iOS 26.5. As capturas abaixo registram o estado final depois do redesign.

## Baseline histórico verificável

- Fonte anterior imutável: commit `b12bf536aa7b4ba4ba88ef12a08ae03d89fe0e13`, especialmente `src/shared/ui`, `src/shared/theme`, `src/features/auth` e as pages consumidoras.
- Contratos observados na época: `MOB-BASE-004`, `MOB-BASE-007` e `MOB-BASE-008` no mesmo commit.
- Comparação reproduzível: `git diff b12bf536aa7b4ba4ba88ef12a08ae03d89fe0e13 -- mobile/src/shared/ui mobile/src/shared/theme mobile/src/features mobile/src/pages`.
- Não existem capturas originais anteriores preservadas no repositório ou nos artefatos desta feature. Elas não foram reconstruídas nem fabricadas; por emenda humana aprovada de AC-012, a fonte/diff histórico acima documenta o estado anterior.

## Matriz final

| Superfície/variante                                     | Captura                                        |
| ------------------------------------------------------- | ---------------------------------------------- |
| Launcher escuro                                         | `after-launcher-dark.jpeg`                     |
| Login escuro                                            | `after-login-dark.jpeg`                        |
| Cadastro escuro                                         | `after-register-dark.jpeg`                     |
| Recuperação escura                                      | `after-forgot-dark.jpeg`                       |
| Estado conectado                                        | `after-connected-dark.jpeg`                    |
| Índice de configurações                                 | `after-settings-dark.jpeg`                     |
| Aparência escura                                        | `after-appearance-dark.jpeg`                   |
| Aparência clara                                         | `after-appearance-light.jpeg`                  |
| Fonte confortável + densidade compacta + alto contraste | `after-high-contrast-comfortable-compact.jpeg` |
| Controles do leitor                                     | `after-reader-controls-dark.jpeg`              |

## Checklist manual

- Safe areas, rolagem e conteúdo essencial alcançável: pass.
- Tema claro, escuro e alto contraste: pass.
- Fonte confortável e densidade compacta: pass, com reflow e rolagem.
- Alvos interativos mínimos e semântica assistiva exposta: pass.
- Login demo, logout e navegação de configurações: pass.
- Teclado/formulários: containers continuam roláveis e usam `KeyboardAvoidingView`.
- Nenhuma rota, dependência visual ou funcionalidade nova foi adicionada.
