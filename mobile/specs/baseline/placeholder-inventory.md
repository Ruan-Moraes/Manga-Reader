# Histórico não normativo de placeholders

Fotografia original da migração em 2026-08-08. Este arquivo não é Baseline Spec, Target Spec nem roadmap aprovado. O comportamento mínimo das superfícies que possuem código passou a ser normativo em `MOB-BASE-008`; funcionalidades inexistentes continuam somente inventariadas aqui.

| Superfície                | Estado observado                                          | Por que não recebe spec detalhada                   |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| Home, Library e Forum     | Baseline mínimo em `MOB-BASE-008`                         | Domínios reais continuam inexistentes               |
| Profile, modal, not found | Baseline mínimo em `MOB-BASE-008`                         | Não define evolução futura                          |
| Reset password            | Strings i18n existem                                      | Não há rota, page nem chamada mobile correspondente |
| Query keys                | Chaves para títulos, capítulos, comentários, library etc. | Constantes não utilizadas não provam feature        |
| Rotas constantes          | Mapeiam somente rotas atuais                              | Não definem navegação futura                        |
| Referências HTML de auth  | Protótipos estáticos                                      | Não são dependência nem contrato de runtime         |

Antes de evoluir qualquer item, usar Spec Architect para criar uma Target Spec `draft`. Se código significativo surgir antes de spec, aplicar Reverse Spec.
