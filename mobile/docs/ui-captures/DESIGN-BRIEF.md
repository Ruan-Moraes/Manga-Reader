# Brief de design — Toonlira mobile: mais simples, direto e padronizado

Documento para uso no Claude Design, junto das capturas de [`light/`](light) e [`dark/`](dark)
(índice em [`README.md`](README.md)). Baseado em uma leitura das telas capturadas em 2026-11-07
(iPhone 18 Pro, pt-BR). Não é uma auditoria de acessibilidade nativa nem de desempenho.

## 1. Objetivo

Reduzir a quantidade de decisões e de elementos por tela, tornar o caminho principal óbvio e fazer
as mesmas ações terem a mesma aparência e o mesmo lugar em todo o app, sem perder funcionalidade.

**Ações principais do produto (devem ser sempre as mais fáceis):**

1. Importar páginas e traduzir um capítulo.
2. Ler (capítulo traduzido ou original) com zoom e retomada.
3. Organizar obras e capítulos na biblioteca.

## 2. Inventário completo de telas e proposta de consolidação

Levantado a partir das rotas (`src/app`) e das páginas (`src/pages`). "Cap." indica o arquivo em
[`light/`](light). Estado = o que o código faz hoje (lido no código; telas marcadas **(não
capturada)** não foram vistas rodando).

### 2.1 Telas que o usuário usa hoje (produto local-first)

| #   | Tela                                                            | Rota                              | O que faz                                                                                                                                          | Cap.   | Proposta                                                                                                                                                                               |
| --- | --------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Início** (seletor de módulos)                                 | `/`                               | Cabeçalho com menu "⋯" (Configurações), cartão-herói, dois cartões: "Traduzir capítulo" e "Plataforma de leitura"; botão de preview de novel (dev) | 01     | **Juntar com a Biblioteca** (vira a tela inicial com as obras e o botão primário "Traduzir capítulo"). Remover o cartão "Plataforma" enquanto estiver "em construção" e o botão de dev |
| 2   | **Biblioteca local**                                            | `/translation-library`            | Cria obra; lista obras (editar nome, escolher capa, capítulos, excluir); lista projetos antigos ainda sem obra (abrir leitor, excluir)             | 15–18  | **Fundir no Início.** Obras como lista de itens; projetos sem obra viram uma seção "Sem obra" compacta com ação "Mover para obra"                                                      |
| 3   | **Obra** (hoje: cartão expandido dentro da Biblioteca)          | —                                 | Capítulos da obra: abrir, renomear, excluir, vincular projeto, criar novo capítulo                                                                 | 16     | **Criar como tela própria** (capa pequena, nome, lista de capítulos, botão "Novo capítulo"). Substitui o botão "Capítulos" que expande                                                 |
| 4   | **Traduzir capítulo** (assistente de 5 etapas)                  | `/offline-translation`            | 1 Importar → 2 Organizar → 3 Idiomas → 4 Validar → 5 Revisar → projeto preparado + lote                                                            | 24–34  | **Reduzir de 5 para 3 etapas** (ver 2.3). Mantém uma tela só com cabeçalho e rodapé fixos                                                                                              |
| 4a  | Seletor de fotos do sistema                                     | (nativo)                          | Escolha múltipla de imagens                                                                                                                        | 25     | Manter (é do sistema)                                                                                                                                                                  |
| 4b  | Organizar páginas (grade/lista)                                 | etapa 2                           | Reordenar por arraste, remover, adicionar mais, confirmar ordem                                                                                    | 26, 27 | **Juntar com Importar** (a mesma tela mostra o que foi importado e permite ordenar)                                                                                                    |
| 4c  | Idiomas (origem → destino) + folha de seleção                   | etapa 3                           | Dois seletores; folha com 7 idiomas                                                                                                                | 28, 29 | **Virar uma linha** "Japonês → Português" dentro da etapa 2 do novo fluxo, com folha ao tocar                                                                                          |
| 4d  | Validar imagens                                                 | etapa 4                           | Confere formato/tamanho de cada página, mostra pronta/problema                                                                                     | 30, 31 | **Remover como etapa**: validar automaticamente ao importar, com chip por miniatura; só interrompe se houver página inválida                                                           |
| 4e  | Revisar e preparar                                              | etapa 5                           | Resumo (páginas, idiomas, validação) e botão "Preparar projeto"                                                                                    | 32     | **Juntar com a tela final**: "Preparar" e "Traduzir" na mesma ação/tela                                                                                                                |
| 4f  | Projeto preparado + Traduzir páginas (lote)                     | pós-etapa 5                       | Resumo, (dev) modo demonstração, aviso de vínculo, lista de páginas com checkbox e botão Traduzir                                                  | 33, 34 | **Manter como destino final do fluxo**, enxuto: lista de páginas + progresso + botão fixo no rodapé. Remover bloco de demonstração do usuário; aviso de vínculo com ação               |
| 4g  | Diálogo de consentimento                                        | folha                             | Texto longo (dados, regiões, retenção, custo), Aceitar e enviar / Agora não                                                                        | 35     | **Manter, em camadas** (resumo curto + "ver detalhes")                                                                                                                                 |
| 5   | **Leitor local**                                                | `/translation-reader/[projectId]` | Leitura imersiva (vertical/paginado/duplo), original/tradução, zoom, marcador de erro/retry, retomada                                              | 19, 20 | Manter. Controles mínimos; selo de demonstração discreto                                                                                                                               |
| 5a  | Folha de configurações do leitor (Leitura / Aparência / Gestos) | dentro do leitor                  | Modo, direção, ajuste, fundo, gestos                                                                                                               | 21–23  | **Compartilhar o mesmo componente** das Configurações > Leitor (já usa os mesmos controles); manter só um lugar de verdade                                                             |

### 2.2 Configurações

| #   | Tela                       | Rota                          | O que faz                                                           | Cap. | Proposta                                                                   |
| --- | -------------------------- | ----------------------------- | ------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| 6   | Índice de configurações    | `/settings`                   | Lista de seções em grupos (Aplicativo, Leitura, Dispositivo, Conta) | 02   | Manter, **sem textos editoriais longos**; esconder o grupo Conta sem login |
| 6a  | Aparência e acessibilidade | `/settings/appearance`        | Tema, texto, densidade, movimento, contraste                        | 03   | Manter                                                                     |
| 6b  | Idioma e região            | `/settings/locale`            | Idioma da interface, datas, fuso                                    | 04   | **Juntar com 6c** em "Idiomas"                                             |
| 6c  | Idiomas do conteúdo        | `/settings/content-languages` | Escolher e ordenar idiomas preferidos                               | 05   | **Juntar com 6b**                                                          |
| 6d  | Leitor                     | `/settings/reader`            | Modo, direção, ajuste, apresentação                                 | 06   | Manter; mesmo componente da folha do leitor (5a)                           |
| 6e  | Privacidade                | `/settings/privacy`           | Visibilidade, rastreamento, conteúdo sensível                       | 07   | **Juntar com 6f** em "Privacidade e dados"                                 |
| 6f  | Dados e armazenamento      | `/settings/data`              | Cache, exportação, histórico                                        | 08   | **Juntar com 6e**                                                          |
| 6g  | Sobre                      | `/settings/about`             | Versão, build, links (suporte, termos, privacidade, projeto)        | 09   | **Virar rodapé do índice** (versão + links), sem tela própria              |

Resultado em Configurações: **de 7 subtelas para 4** (Aparência, Idiomas, Leitor, Privacidade e dados)

- rodapé "Sobre". Verificar antes de juntar quais seções exigem login (`access.loginRequired` no
  código) para manter o bloqueio correto.

### 2.3 Autenticação e plataforma (hoje "em construção")

| #   | Tela                                          | Rota                         | O que faz                                                                                 | Cap.                              | Proposta                                                                                                                         |
| --- | --------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Login                                         | `/login`                     | E-mail e senha; "Esqueci a senha"; credenciais de demonstração                            | 10                                | **Juntar 7, 8 e 9 numa única tela de conta**: alternador "Entrar / Criar conta"; "Esqueci a senha" como etapa/folha              |
| 8   | Cadastro                                      | `/register`                  | Criar conta                                                                               | 11                                | (junto com 7)                                                                                                                    |
| 9   | Recuperar senha                               | `/forgot`                    | Pedir recuperação                                                                         | 12                                | (junto com 7)                                                                                                                    |
| 10  | Status da plataforma / conta conectada        | `/platform/status`           | Mostra "Conta conectada / em construção"; sair                                            | (redireciona ao login sem sessão) | **Remover**; informações de conta vão para Configurações > Conta                                                                 |
| 11  | Abas da plataforma: Início, Biblioteca, Fórum | `/platform/(tabs)/*`         | **Placeholders "em breve"** (EmptyState) **(não capturada)**                              | —                                 | **Remover do build de usuário** até existir conteúdo. Além de vazias, repetem o nome "Biblioteca"                                |
| 12  | Aba Perfil                                    | `/platform/(tabs)/profile`   | Nome/e-mail, atalhos de configurações, sair **(não capturada)**                           | —                                 | **Juntar a Configurações > Conta**                                                                                               |
| 13  | Leitor de capítulo da plataforma              | `/reader/[titleId]/[number]` | Leitor de capítulos vindos da API (retomada de progresso autenticado) **(não capturada)** | —                                 | **Manter**, mas com a mesma aparência do leitor local (já usa o mesmo widget); sem entrada na interface até a plataforma existir |

Observação: o código não expõe as abas da plataforma na navegação atual; elas existem como rotas.
A recomendação é tirá-las do build de usuário (ou atrás de uma flag) para não manter UI que não faz nada.

### 2.4 Telas utilitárias e de desenvolvimento

| #   | Tela                             | Rota                     | O que faz                                                 | Cap. | Proposta                                                  |
| --- | -------------------------------- | ------------------------ | --------------------------------------------------------- | ---- | --------------------------------------------------------- |
| 14  | Preview de novel                 | `/reader-preview/novel`  | Leitor de texto de teste                                  | 13   | **Remover do build de usuário** (somente desenvolvimento) |
| 15  | Modal                            | `/modal`                 | Tela-modelo "Modal" vazia                                 | —    | **Remover** (resto de template)                           |
| 16  | Página não encontrada            | (qualquer rota inválida) | Mensagem e ações "Ir para o início" e "Buscar obras"      | 14   | Manter; **remover "Buscar obras"** (não existe busca)     |
| 17  | Alertas de confirmação (`Alert`) | diversos                 | Excluir obra/capítulo/projeto; sair durante processamento | —    | **Padronizar** numa folha única de confirmação (2.5)      |

### 2.5 Resumo da consolidação

| Área                                     | Hoje                                 | Proposta                                                   |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Início + Biblioteca                      | 2 telas                              | **1** (Início = Biblioteca) + **Tela da Obra**             |
| Fluxo de tradução                        | 5 etapas + preparado + consentimento | **3 etapas** + consentimento em camadas                    |
| Configurações                            | índice + 7 subtelas                  | índice + **4 subtelas** (+ rodapé "Sobre")                 |
| Autenticação                             | 3 telas + status                     | **1 tela de conta**                                        |
| Plataforma (abas, perfil, status, modal) | 7 telas/rotas                        | **0 no build de usuário** (Perfil → Configurações > Conta) |
| Utilitárias de dev                       | preview de novel                     | fora do build de usuário                                   |

Telas mantidas (visíveis ao usuário): Início/Biblioteca, Obra, Fluxo de tradução (3 etapas + lote),
Leitor (+ folha de configurações), Configurações (índice + 4), Conta, 404. **De 32 telas/rotas (contando etapas, folhas e diálogos) para cerca de 16
na mesma contagem.**

### 2.6 Navegação proposta

```
Início (Biblioteca)
 ├─ Nova obra (folha) ───────────────► Obra
 ├─ Obra ─┬─ Capítulo ──► Leitor ──► Folha de configurações do leitor
 │        └─ Novo capítulo ─► Importar+Organizar ─► Idiomas ─► Traduzir (lote)
 ├─ Traduzir capítulo (primário) ────► (mesmo fluxo)
 └─ Configurações ─┬─ Aparência
                   ├─ Idiomas
                   ├─ Leitor
                   ├─ Privacidade e dados
                   └─ Conta (Entrar/Criar conta, sair) + Sobre (rodapé)
```

### 2.7 Cuidados antes de juntar etapas e telas

- **Contratos de produto**: as etapas atuais (ordem confirmada, idiomas confirmados, validação,
  preparação) estão ligadas a regras em especificações e testes. Juntar etapas muda a **interface**,
  não essas regras: a confirmação de ordem e de idiomas continua explícita (pode ser implícita no
  botão "Continuar", mas precisa continuar registrada) e a validação continua obrigatória antes de
  preparar. Requer atualizar as specs/testes correspondentes.
- **Consentimento**: o envio remoto continua exigindo aceite explícito antes de qualquer chamada.
- **Telas que somem** devem ter as rotas removidas de `src/app`, dos testes, do `coverage.json` e
  das chaves i18n nos três idiomas.
- **Dados existentes** (obras, capítulos, projetos sem obra) não podem ser perdidos: projetos antigos
  continuam acessíveis na seção "Sem obra".

## 3. Princípios

1. **Uma ação principal por tela.** Um único botão primário; o resto vira secundário, texto ou menu.
2. **Mostrar o estado, esconder o procedimento.** Progresso e resultado primeiro; explicações longas
   (consentimento, retenção, política) em camadas, abertas sob demanda.
3. **Padrão antes de ornamento.** Reutilizar os mesmos componentes e espaçamentos; variação só com
   motivo.
4. **Menos botões de largura total empilhados.** Ações por item (editar, renomear, excluir) pertencem
   ao item, em menu ou ícone, não a uma pilha de botões.
5. **Linguagem curta e consistente.** Um termo por conceito em todo o app.
6. **Erros úteis e discretos.** Perto da causa, com ação clara, sem competir com o conteúdo.

## 4. Diagnóstico (a partir das capturas)

### 4.1 Biblioteca e obras — `15`, `16`, `17`, `18`

- A obra aparece como um cartão com **quatro a sete botões de largura total empilhados** (Editar nome,
  Escolher capa, Capítulos, Excluir obra, e ainda, ao expandir: Abrir, Renomear, Excluir capítulo,
  Vincular projeto anterior, Preparar páginas). A tela vira uma lista de botões iguais; a ação principal
  (abrir a obra/capítulo) não se destaca.
- Excluir tem o mesmo peso visual de Editar e fica logo abaixo dele (risco de toque errado).
- O formulário "Criar obra" ocupa um cartão inteiro permanente, acima da lista.
- Projetos antigos aparecem como uma segunda lista ("Projeto de 25/10/2026…") sem nome útil, com
  pré-visualização grande e dois botões de largura total cada. Os termos "obra", "projeto" e "capítulo"
  se misturam.
- "Capítulos" é um botão que expande uma lista; deveria ser uma navegação para uma tela da obra.

### 4.2 Fluxo "Traduzir capítulo" — `24`–`34`

- O fluxo em 5 passos é claro (indicador de progresso), mas **cada passo repete cabeçalho grande +
  descrição + cartão**; a pergunta "o que faço agora?" demora a aparecer.
- Na etapa de importar, o bloco **"Projeto preparado no aparelho" (projeto antigo)** aparece acima da
  área de seleção, o que confunde ("já terminei?").
- Na tela de projeto preparado empilham-se quatro blocos: resumo, "Modo de demonstração" (somente
  desenvolvimento), erro de vínculo e painel de lote. A ação principal (traduzir) está no fim da rolagem.
- O aviso de erro de vínculo (vermelho, fora de cartão) é solto e não oferece ação.
- Etapa de idiomas: dois seletores de largura total e uma seta; poderia ser uma linha "Japonês → Português".

### 4.3 Painel de lote — `34`

- Boa base: lista de páginas com checkbox e estado. Faltam: seleção em lote ("todas/nenhuma"),
  progresso agregado mais visível e distinção clara entre "aguardando", "processando", "salva", "falhou"
  e "incerta" (hoje só texto cinza à direita).
- O botão primário muda de texto com a contagem ("Traduzir 2 páginas"); manter, mas fixar no rodapé
  da tela em vez de no fim do cartão.

### 4.4 Leitor — `19`–`23`

- Imersivo e limpo. Barra superior com "Leitor local / DEMONSTRAÇÃO" e engrenagem; barra inferior com
  progresso. O selo "DEMONSTRAÇÃO" é permanente e ocupa a subtítulo da barra.
- A folha de configurações é longa (Modo, Direção, Ajuste, …) com opções em cartões grandes; abas
  Leitura / Aparência / Gestos são boas, mas poderiam ter controles mais compactos.
- Faltam atalhos de contexto no próprio leitor: ver original/tradução, zoom (restaurar aparece só
  durante o zoom).

### 4.5 Configurações — `02`–`09`

- Estrutura em índice + subtelas é adequada. Verificar densidade e se os grupos têm títulos iguais.
  (Não foi feita uma comparação linha a linha das subtelas.)

### 4.6 Início, login e telas de estado — `01`, `10`–`15`

- Início: cartão-herói grande + dois cartões de ação + botão de desenvolvimento. O botão
  "Abrir preview de novel (desenvolvimento)" **não deve existir em build de usuário**.
- Login: boa hierarquia (ilustração, título, campos, ação). "Credenciais de demonstração" aparece
  no formulário; confirmar que é só desenvolvimento.
- Cabeçalhos: nas telas do fluxo e da biblioteca há **voltar quadrado + Home**; no leitor, voltar
  em barra própria; no login, voltar sem Home. Padronizar a regra de quando Home aparece.

## 5. Inconsistências para padronizar

| Tema              | Hoje                                                                       | Proposta                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Botões            | Muitos `outline` iguais, largura total, empilhados; `danger` como outline  | 1 primário por tela; secundário discreto; ações por item em menu "⋯"; destrutivas fora da zona de toque principal e com confirmação |
| Termos            | "Obra", "Projeto", "Capítulo", "Biblioteca local" misturados               | Definir glossário: Obra > Capítulo > Página. Evitar "projeto" para o usuário                                                        |
| Cabeçalho         | Voltar/Home variam por tela                                                | Regra única: voltar sempre; Home só em fluxos profundos; título curto                                                               |
| Títulos de página | Eyebrow + título grande + descrição em todo passo do fluxo                 | Título curto + uma linha de apoio; eyebrow só quando agrega                                                                         |
| Cartões           | Raios, sombras e preenchimentos variam (cartão elevado vs. cartão chapado) | 2 variantes (padrão e destaque)                                                                                                     |
| Estados           | Texto cinza, cor de erro solta, selo amarelo de demonstração               | Componente único de status (ícone + rótulo + cor semântica)                                                                         |
| Espaçamento       | Margens horizontais e entre blocos variam                                  | Escala única (tokens existentes)                                                                                                    |
| Idiomas           | Seletor de origem/destino empilhado                                        | Linha única "origem → destino"                                                                                                      |
| Listas de item    | Cartão grande com imagem + botões                                          | Linha compacta: miniatura, título, meta, estado, menu                                                                               |

## 6. Padrões propostos

1. **Cabeçalho padrão**: voltar (esquerda), título, ação contextual (direita). Home só no fluxo.
2. **Botão primário fixo no rodapé** nas telas de fluxo (importar, confirmar ordem, idiomas, validar,
   revisar, traduzir).
3. **Item de lista padrão** (obra, capítulo, página, projeto antigo): miniatura, título, uma linha
   de meta, chip de estado, menu "⋯" com as demais ações.
4. **Tela da Obra**: capa pequena, nome, lista de capítulos, botão primário "Novo capítulo".
   Criar/editar obra em folha (bottom sheet), não em cartão permanente.
5. **Folha de confirmação** para exclusão, descrevendo o que é removido, com botão destrutivo
   separado do cancelar.
6. **Consentimento em camadas**: resumo de 3 linhas (o que sai do aparelho, custo, retenção) +
   "Ver detalhes" para o texto longo + política/termos. Botões Aceitar e Agora não sempre visíveis.
7. **Chip de estado** único para página/lote: aguardando, processando, salva, falhou, incerta.
8. **Seleção em lote**: "Selecionar todas" e contador; progresso agregado no topo.
9. **Leitor**: controles mínimos (voltar, original/tradução, configurações); selo de demonstração
   só quando relevante e em tamanho discreto.

## 7. Prioridades

**P0 — simplificar o caminho principal**

- Reorganizar a biblioteca em lista de obras (item padrão) + tela da obra com capítulos.
- Remover o bloco de projeto antigo da etapa "Importar" e do topo do projeto preparado.
- Botão primário fixo no rodapé em todas as etapas do fluxo.
- Tirar itens de desenvolvimento (preview de novel, demonstração, credenciais de demonstração)
  da experiência de usuário.

**P1 — padronização**

- Glossário único e revisão dos textos nos 3 idiomas.
- Cabeçalho único; escala de espaçamento; 2 variantes de cartão; componente de status.
- Linha única "origem → destino"; consentimento em camadas.

**P2 — refinamento**

- Folha de configurações do leitor mais compacta; atalhos de contexto no leitor.
- Estados vazios, de erro e de carregamento com ilustração/mensagem consistentes.
- Revisão do modo escuro nas telas ainda sem captura.

## 8. Restrições técnicas (obrigatórias)

- React Native + Expo; componentes reutilizáveis em `src/shared/ui`; arquitetura FSD (boundaries
  verificados por `lint:fsd`).
- **Nada de cor ou texto fixos**: usar os tokens de tema (claro/escuro e alto contraste) e i18n em
  `pt-BR`, `en-US` e `es-ES` (todas as chaves nos três).
- Áreas de toque mínimas e rótulos acessíveis (`accessibilityLabel`, papéis e estados) em todos os
  controles novos; respeitar tamanho de fonte do sistema e movimento reduzido.
- Não mudar contratos de dados/fluxos (SQLite, consentimento, envio volátil, regras de retry).
  Alterações de UI não podem enviar nada ao gateway nem pular o consentimento.
- Sem dependências novas quando as atuais bastarem.
- Cobrir mudanças com testes de componente; manter `npx tsc --noEmit`, ESLint, `lint:fsd` e Jest verdes.

## 9. Critérios de aceite

1. Cada tela tem um único botão primário identificável em até 2 s (teste de relance).
2. Biblioteca: abrir um capítulo a partir da lista de obras em no máximo 2 toques.
3. Nenhuma tela do fluxo exige rolagem para chegar à ação principal.
4. Os mesmos termos, cabeçalho, cartões, estados e espaçamentos nas telas de biblioteca, fluxo,
   leitor e configurações.
5. Sem textos ou cores fixos; claro e escuro verificados; 3 idiomas completos.
6. Nenhum item de desenvolvimento visível em build de usuário.
7. Testes e gates de qualidade passando.

## 10. Entregáveis esperados do design

- Protótipo das telas: Início, Biblioteca, Tela da Obra, Fluxo (5 etapas + preparado/lote),
  Consentimento, Leitor (+ folha de configurações), Configurações e Login.
- Biblioteca de componentes mínima: cabeçalho, item de lista, chip de estado, folha/diálogo,
  botões (primário/secundário/destrutivo), campos e seletores.
- Guia de tokens (cor, tipografia, espaçamento, raio, sombra) alinhado ao tema atual.
- Lista de mudanças de texto proposta (para revisão nos 3 idiomas).
