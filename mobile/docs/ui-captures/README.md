# Capturas de UI — Toonlira mobile

Capturas do app no **iPhone 18 Pro (simulador iOS 27)**, 1206×2622 px (3×), em pt-BR, geradas em
2026-11-07 a partir do código atual da branch `feat/auth-refresh-rotation` (com as mudanças da
MOB-FEAT-055). Servem de insumo para revisão de UI/UX. Dados de exemplo: uma obra ("Obra Teste")
com capa padrão, projetos com imagens do mascote e resultado de demonstração.

Pastas: `light/` (modo claro, conjunto completo) e `dark/` (modo escuro, telas principais).

## Mapa das telas (claro)

| Arquivo                           | Tela / estado                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01-launcher                       | Início: seletor "Traduzir capítulo" / "Plataforma de leitura"                                                                                        |
| 02–09-settings-\*                 | Configurações: índice, aparência, idioma e região, idiomas de conteúdo, leitor, privacidade, dados, sobre                                            |
| 10–12-auth-\*                     | Login, cadastro, recuperar senha                                                                                                                     |
| 13-novel-preview                  | Preview de novel (somente desenvolvimento)                                                                                                           |
| 14-not-found                      | Rota inexistente (404)                                                                                                                               |
| 15-library-top                    | Biblioteca local: criar obra e obra com capa padrão                                                                                                  |
| 16-library-work-chapters-expanded | Obra com capítulos: abrir, renomear, excluir, vincular, novo capítulo                                                                                |
| 17–18-library-project-cards       | Cards de projetos locais (abrir leitor / excluir)                                                                                                    |
| 19–20-reader-\*                   | Leitor imersivo e leitor com barras visíveis                                                                                                         |
| 21–23-reader-settings-\*          | Folha de configurações do leitor: Leitura, Aparência, Gestos                                                                                         |
| 24–32-flow-\*                     | Fluxo "Traduzir capítulo": importar, seletor de fotos, organizar (grade e lista), idiomas (e folha de seleção), validar (pendente e pronta), revisar |
| 33–34-flow-prepared-\*            | Projeto preparado e painel "Traduzir páginas do capítulo" (lote)                                                                                     |
| 35-consent-dialog-bottom          | Diálogo de consentimento de envio remoto                                                                                                             |

## Fora das capturas (e por quê)

- **Abas da plataforma** (`/platform/(tabs)/*`) e leitor de capítulos da plataforma: exigem sessão
  autenticada; sem login o app redireciona para o login.
- **Marcador de erro com retry no leitor e zoom ativo**: dependem de página com falha / gesto de
  pinça; estados cobertos pelos testes, não capturados aqui.
- Estados de erro, vazio e carregamento nem sempre aparecem com os dados de exemplo.

Observação: telas longas foram capturadas só no topo (e, na biblioteca, em posições rolando).
