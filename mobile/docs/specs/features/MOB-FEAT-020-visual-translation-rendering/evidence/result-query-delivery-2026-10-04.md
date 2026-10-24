# Evidência parcial — entrega privada nas consultas, 2026-10-04

Parcela da TASK-006/AC-005, com gate aberto e 019 em verification-pending.
020 continua in-progress; 021 approved/blocked. Nenhuma chamada Google,
credencial, deploy ou ativação de uploads. Não comprova qualidade linguística.

## Plano e implementação inspecionada

[Plano anterior](../../../../../../api/apps/translation-gateway/docs/result-query-delivery.md):
projeção BCNF estreita owner-scoped, PK/UNIQUE existentes, V1–V6 preservadas.
Nenhuma migration, índice/cache novo, texto ou URL no banco. Snapshot bloqueia
somente o job correspondente e não mantém transação durante assinatura.

GetJobResultUseCase suspende até uma transação externa; JobResultSnapshotUseCase
aplica TTL e obtém metadados em transação curta. Entre dois snapshots, assina
imagem e manifesto. A reconsulta compara ownership, job e referências, confere
hash/bytes/MIME e prazo efetivo. Falha de storage não publica par parcial; após
ACK/TTL confirmado, retorna RESULT_EXPIRED sem URLs. READY sem artefato ou
assinatura válida falha fechado com 503/storage-unavailable, sem causa.

GET por referência/idempotência exige resultado completo, usa no-store e
serverTime do instante da resposta. Mesmo envelope 1.0/oito rotas, com result
aditivo: versão do manifesto, dimensões/deadline e dois downloads limitados.
Mutação/replay pode omitir result; a aquisição futura usa GET. O manifesto OCR
1.0, task interna e defaults não mudam. Assinatura permanece disabled.

Parser mobile no slice existente valida schema estrito, host HTTPS, prazos,
hashes, MIME, bytes, dimensões e consistência READY/erro. Não baixa arquivos,
persiste URLs, grava resultado ou envia ACK. Essa parcela da 020 não abre a 021.
Trabalho JS adicional limitado a dois metadados/URLs de até 8192 caracteres,
sem materializar mídia/texto; métricas nativas não medidas nem presumidas.

ACK posterior à última leitura ainda pode ocorrer. URLs já emitidas não têm
revogação instantânea garantida; TTL curto e remoção durável limitam a janela.
Metadata do storage não prova hash dos bytes adquiridos: responsabilidade da 021. Retenção terminal integral, codec/distribuição, caps/deadline global,
profiling e revisão visual continuam pendentes, não aceites externos simulados.

## Testes

Fixtures sintéticas, sem capturas privadas ou ADC:

- domínio: dimensões/chaves/hash/bytes/conclusão e representações redigidas;
- aplicação: estados não READY sem storage, owner inválido, idempotência,
  ACK/erro durante assinatura, metadata alterada/inválida, segundo artefato
  ausente, prazo quase vencido e nenhuma repetição explícita;
- snapshots: legado READY sem metadados não inventa resultado, ACK entre
  leitura e projeção produz novo estado;
- PostgreSQL 17: projeção owner-scoped, assinatura fora de transação mesmo
  com chamador transacional, ACK em outra conexão durante I/O, TTL depois da
  assinatura e fila durável única; EXPLAIN com LockRows e índices existentes;
- HTTP/OpenAPI: shape completo, no-store, 503 sanitizado, autenticação antes
  de consulta, isolamento, oito rotas e versão preservadas;
- mobile: contrato completo, estados incompatíveis, metadata excessiva,
  campos sensíveis/URLs inseguras, prazos e erro conflitante.

Red inicial por classes ausentes e controller antigo; parser rejeitou result
antes da implementação. Stubbing do Mockito corrigido para doAnswer na
substituição de callback, sem remover asserções. Resultado sintético não é
prova de storage/IAM real ou aquisição local completa.

## Fotografia e gates

263 arquivos técnicos do gateway, SHA-256
`8c68ca5195b05b779638fb68967bb08d5a0a6f27a713a7963491b23e9310d556`.
Algoritmo anterior preservado: paths relativos ordenados em src/scripts/openapi,
pom.xml e Terraform tf/tfvars.example; path+NUL+bytes+NUL. Docs/build/dados
privados excluídos; checksum mobile é governança, não cobertura Java.

Maven global offline/Docker com codec nativo opt-in: exit 0. Gateway nessa
execução: 808 testes/68 classes, zero falhas/erros/ignorados, contados nos XMLs
modificados depois do início (2026-10-04T11:35:30.169Z), antes da suíte leve.
Quatro XMLs históricos de harness manual ficaram fora por data; não foram
apagados nem contados como nova execução. Os três arquivos de testes novos
somam 30 casos; regressões adicionais estão nas classes existentes.
Opt-ins nativos confirmados: worker 10, arquivos 8 e codec 19, todos executados.

```bash
cd api
./mvnw -o -q test -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/cwebp \
  -Drenderer.cwebp.sha256=b31070342821b6316c756e22a336a72bbde4a6e4f2a9cabb22ffd49a73cc89cf \
  -Drenderer.dwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/dwebp \
  -Drenderer.dwebp.sha256=0fea0ca571920dac090ca32f4e4559b5125b92e33963b314f27c6757c1c1201c
```

Esses caminhos identificam o ambiente medido, não são configuração portátil de
produção. Não houve instalação/download ou chamada real. Primeira tentativa
global falhou pelo callback de teste; a correção foi reexecutada e passou.
A rodada final acima habilitou explicitamente renderer.native.enabled;
propriedades de path sem esse opt-in não comprovam execução nativa.

Suíte leve gateway offline exit 0, com opt-ins nativos não selecionados.
Node tooling: 85 pass/um opt-in de fonte não executado. Web tsc -b exit 0.
pnpm check integral exit 0: 116 suítes/892 testes, 30 performance, 24 SDD e
seis FSD; type-check/lint/formato/links aprovados. Parser focalizado: 43 casos,
incluindo 33 novos. Nenhum teste/validador/script de check removido ou enfraquecido;
dependências e lockfiles preservados. Formatação direcionada e diff-check
passaram. SDD/links finais exit 0: 67 artefatos normativos, 1489 arquivos
classificados, 362 behavior e 201 evidence. Headers rebaseados mecanicamente,
sem renovar conclusões históricas nem promover o gate da 021.

Fotografias anteriores preservadas: assinatura privada e expiração consultável
possuem seus próprios hashes/evidências, não renovados por esta execução.
