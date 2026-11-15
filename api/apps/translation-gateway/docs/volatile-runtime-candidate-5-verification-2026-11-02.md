# Candidata volátil 5 — verificação local em 2026-11-02

> Fotografia positiva anterior ao contraexemplo c5 HTTP11: o cenário SIGSTOP90s
> atingiu timeout de120s do cliente. Preservar esse resultado negativo; a
> [prova c6 de2026-11-03](volatile-runtime-candidate-6-verification-2026-11-03.md)
> documenta a correção e a nova execução, sem aprovar retroativamente a c5.

## Artefato e correção

JAR `c0246b95a4df89ac110e81e17c355940f1afe2dcb477e1df6a681e0db02403fa`;
imagem ARM64 `sha256:25a772f3637774b37311aeca4a7ec000644fdb463b3aeeb5369d214686421069`.
Manifesto nativo `bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.

A revisão independente encontrou uma janela entre a preparação/resolução da
etapa e o início do próximo provider. A sessão agora verifica abandono e
interrupção imediatamente antes de OCR, tradução e render. Cinco regressões
falharam antes e passaram após a correção. Três cenários adicionais compõem
use case e supervisão reais: reserva/preparação bloqueada ignora interrupção,
o deadline encerra a espera, a capacidade permanece ocupada até a limpeza e
nenhuma etapa seguinte começa depois de liberado o bloqueio.

## Provas atuais

- HTTP privado, rodadas 9 e 10: oito OCR/sete traduções, sem violação inline,
  oito recibos, zero jobs legados, zero arquivos regulares/conteúdo ao fim.
  Incluem 80 MP em PNG/JPEG/WebP e PNG válido com exatamente 12 MiB;
  autenticação, owner scope, replay, concorrência, morte da filha, falha OCR
  e recuperação por nova página válida.
- Rodada 10: pico agregado 1947095040 bytes, limite 8 GiB, swap zero, 64 PIDs,
  `pids.events=max 0`, zero OOM. CPU `200000 100000`; pai e filha sob limite
  de espaço de endereçamento 3221225472 bytes. A filha é medida enquanto viva;
  a métrica final zero significa que nenhuma filha permaneceu após a chamada.
- Matriz nativa: oito cenários/22 renders; pico máximo 1457901568 bytes,
  zero OOM e zero arquivos de conteúdo. Sete destinos, formatos máximos,
  limites horizontal/vertical e imagem de uma linha/coluna.
- Nove entregas visuais: nove OCR/oito traduções, pico 917676032 bytes,
  zero OOM/conteúdo. Comparação independente verificou 8699904 pixels,
  preservação fora das regiões e imagem vazia integralmente idêntica.
  Os nove WebPs são byte a byte iguais aos inspecionados na candidata 4.
- Overflow mantém integralmente 4860 caracteres. A indicação e o painel
  acessível no aparelho pertencem à integração 021, ainda sem aceite.
- Translation transport cobre 30000 codepoints incluindo HTML/marcadores,
  rejeição de 30001 sem RPC, expansão de entidades e Unicode suplementar.

Servidor e cliente ficam em rede Docker interna sem portas publicadas; somente
o cliente recebe mounts de imagens sintéticas e saída. Providers são SDKs
reais contra fakes privados. Não houve chamada paga ou mídia de usuário.
Logs operacionais sanitizados foram preservados e não contêm textos/bearer.

## Proveniência e limites

Arquivo local `candidate-5-local-verification-20261102/`, sob
`.local/mob020-volatile-20261101/`, conserva logs red/green, matriz, HTTP,
testes de deadline, métricas, hashes e verificador de pixels. As entregas do
cliente estão em `visual-client-candidate-5-20261102-1/`; os logs HTTP também
permanecem nos diretórios próprios das rodadas 9 e 10.

Esta prova local ARM64 não substitui a admissão AMD64/COS125, qualidade humana
de OCR/tradução, verificação física do aplicativo ou políticas/operação pública.
A evidência c4 permanece histórica e não comprova a correção nova.

Raiz backend final `./mvnw -o test`: exit0, 2859 testes, zero falhas/erros,
115 skips; 468 XMLs reescritos na rodada. Recibo `root-tests-20261102-5/`.
