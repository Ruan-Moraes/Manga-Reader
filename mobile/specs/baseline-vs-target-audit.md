# Auditoria baseline versus intenção

Auditoria brownfield de 2026-08-08. Os itens abaixo não autorizam correções nem escolhem o Target.

| Área                   | Baseline observado                                                                          | Direção ou expectativa                                                                     | Status                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Acesso principal       | Visitante fora de `(auth)` é redirecionado ao login                                         | Experiência principal futura deve funcionar sem login obrigatório                          | **CONFLICT** — requer Target Spec                                 |
| Dependência da Core    | Login, cadastro, recuperação e sessão dependem de endpoints Core                            | Produto mobile-first não deve depender da plataforma completa para a experiência principal | **CONFLICT** — limites ainda indefinidos                          |
| Hidratação             | Tokens válidos marcam autenticado, mas `user` permanece nulo                                | Perfil/sessão normalmente precisam de identidade reidratada                                | **AMBIGUOUS** — não inferir solução                               |
| Snapshot de tokens     | Refresh atualiza SecureStore, mas não `sessionStore.tokens`; requests leem o storage direto | Consumidores futuros podem interpretar o snapshot como atual                               | **TECHNICAL DEBT** — contrato ainda não definido                  |
| Falha de storage       | Rejeições podem manter o gate bloqueado ou impedir notificação de expiração                 | Experiência de recuperação não está definida                                               | **AMBIGUOUS** — requer Target Spec antes de mudar                 |
| Manter sessão          | Checkbox muda apenas estado local da tela                                                   | Label sugere política de persistência                                                      | **INCOMPLETE** — sem intenção aprovada                            |
| Newsletter             | Checkbox não altera request de cadastro                                                     | Label sugere opt-in persistido                                                             | **INCOMPLETE** — sem contrato Core/mobile                         |
| Termos/privacidade     | Aceite é validado, mas labels não navegam                                                   | Labels visuais sugerem documentos acessíveis                                               | **INCOMPLETE** — URLs/fluxo não definidos                         |
| Login social           | Google e Apple aparecem sem handlers                                                        | Controles sugerem provedores funcionais                                                    | **PLACEHOLDER** — não tratar como feature                         |
| Reenvio de recuperação | “Tentar de novo” reinicia apenas o cooldown                                                 | Label pode sugerir novo envio                                                              | **AMBIGUOUS** — comportamento atual deve ser redesenhado por spec |
| Confirmação de senha   | Valor vazio não bloqueia cadastro                                                           | UI apresenta o campo como confirmação                                                      | **AMBIGUOUS** — validação futura não aprovada                     |
| Reset password         | Há traduções, mas não rota/tela/serviço mobile                                              | Fluxo textual sugere capacidade                                                            | **PLACEHOLDER** — inventariado somente                            |
| FSD                    | `application/**` e testes são ignorados pelo Steiger; auth types/stores vivem em `shared`   | FSD canônico tende a boundaries mais estritos                                              | **TECHNICAL DEBT** — não refatorar nesta migração                 |
| Tabs                   | Home, Library e Forum são empty states                                                      | README contém roadmap amplo                                                                | **PLACEHOLDER** — roadmap não é Target Spec                       |

## Como resolver futuramente

1. Usar Spec Architect para explicitar a intenção e os `AC-*`.
2. Obter aprovação humana.
3. Gerar tasks que indiquem quais `OBS-*` serão substituídos.
4. Implementar e revisar sem reescrever o baseline para esconder a mudança.
