# Supressão auditável de duplicatas — 2026-09-27

Correção experimental implementada no gateway, sem habilitação operacional.
`MOB-FEAT-018` permanece `in-progress`. Este registro não aprova qualidade geral,
idiomas ou onomatopeias e não substitui referência humana independente.

## Regressão e decisão

Uma página coreana apresentou duas caixas quase coincidentes para o mesmo balão
(IoU aproximado 0,9891), ambas acima da confiança mínima. A associação conservadora
mantinha dois candidatos e excluía essa fala da ordem sugerida, sem apagar o OCR.
Um teste de regressão reproduziu o defeito antes da correção: uma falha, sem erro
de execução. Depois da filtragem, passou mantendo texto e geometria OCR intactos.

Política determinística de domínio: IoU ≥ 0,95 contra caixas já retidas, confiança
decrescente, desempate por coordenadas e ID. Sem agrupamento transitivo, fusão de
caixas/texto ou regras por amostra. Limite bruto de 256 validado antes da supressão.
Auditoria no layout `1.1`, leitores compatíveis com `1.0`. O domínio revalida a
auditoria antes do upload; o executor local também a confere antes de renderizar.

## Avaliação local observada

Dez páginas existentes foram reproduzidas pelo worker com PostgreSQL 17 temporário,
captura Vision anterior e nova inferência local CPU. Cada página ganhou diretório
de análise exclusivo, sem sobrescrita da rodada anterior. Nenhuma credencial ou
serviço Google foi usado, nenhuma imagem foi enviada e nenhuma chamada OCR nova
foi executada. Modelo, hash e limiar de confiança permanecem os mesmos.

| Idioma    | Páginas | Quadros por página | Balões retidos por página |    Supressões | Comparação semântica               |
| --------- | ------: | -----------------: | ------------------------: | ------------: | ---------------------------------- |
| Português |       2 |                  3 |                         2 |             0 | Igual à anterior                   |
| Inglês    |       2 |                  3 |                         2 |             0 | Igual à anterior                   |
| Espanhol  |       2 |                  3 |                         2 |             0 | Igual à anterior                   |
| Japonês   |       2 |                  3 |                         2 |             0 | Igual à anterior                   |
| Coreano   |       2 |                  3 |                         2 | 1 na página 2 | Página 1 igual; página 2 corrigida |

Na página coreana 2, as dez regiões continuam presentes e agora entram uma vez
cada na ordem sugerida. A fala antes ambígua tem um único balão; não restaram
ambiguidades nessa página. A caixa descartada permanece visível na auditoria.
O estado experimental continua `partial` devido a elementos sem balão, não foi
forçado a `complete`.

Comparação das outras nove páginas: quadros, caixas retidas, associações, grupos,
ordem, não associados, ambiguidades e estado sem alteração semântica. Hashes das
imagens, capturas, manifestos, resultados e relatórios anteriores preservados.
Regeneração dos dez relatórios novos produziu HTML idêntico, sem inferência.
Todos tiveram um replay OCR, zero chamadas Vision novas e cleanup sem pendências.

O resultado e as comparações por rodada ficam apenas na área local ignorada pelo
Git. Não foram versionados imagens, textos OCR ou capturas do provider.

## Validação automatizada

- Node: 31 testes passaram, incluindo compatibilidade, auditoria adulterada,
  limites, referências para caixas suprimidas e escape HTML.
- Gateway: suíte completa com Docker passou. Testes existentes cobrem V1–V3,
  cancelamento, rollback, confirmação perdida, limpeza e isolamento de falhas.
- Type-check web (`tsc -b`): passou.
- SDD: 24 testes, validação de specs e links passaram. Nenhum arquivo mobile foi
  alterado; o checksum mobile não foi afetado nem renovado artificialmente.
- Formatação direcionada passou nos scripts, README e documentos do gateway e
  plano arquitetural. `docs/tech-debt.md` mantém diferenças de formatação
  preexistentes em tabelas/listas fora do trecho alterado; sem formatação global.
- Links dos documentos do gateway e plano arquitetural passaram. A varredura
  ampliada encontrou duas referências históricas ao mesmo arquivo ausente
  `docs/audits/2026-07-02-project-audit.md` em `docs/tech-debt.md`; não foram
  introduzidas nesta correção e permanecem pendentes.
- `git diff --check`: passou.
- Maven global (`./mvnw -o -q test`): passou com Docker, exit code 0.

A primeira execução leve no sandbox encontrou sete erros de abertura de socket
do gRPC local falso, sem falhas de asserção. A execução completa com acesso a
Docker/loopback passou; nenhuma permissão ou configuração cloud foi alterada.

Comandos reproduzíveis a partir da raiz (Maven dentro de `api`):

```bash
node --test api/apps/translation-gateway/scripts/*.test.mjs
cd api
./mvnw -o -q -pl apps/translation-gateway -am test
./mvnw -o -q test
```

Para nova análise local, escolher ID ainda não utilizado e seguir o comando
`layout` no [contrato experimental](layout-experimental.md#replay-local).
Não executar `run --mode vision` para reproduzir essa avaliação.

## Persistência e limites

Conforme `database-design`, PostgreSQL continua com metadados BCNF determinados
por `job_id`, PK/FK composta/cascade e CHECKs preservados. Geometria/auditoria ficam
no storage privado, protegidas pelo hash existente. Sem V4, índice, contador ou
cache novo; inferência permanece fora da transação.

Balões distintos quase coincidentes ainda exigem revisão humana. Não se presume
acurácia geral a partir destas dez páginas. Sem tradução, deploy, novas imagens,
alterações legais ou ativação de uploads. Defaults permanecem desabilitados.
