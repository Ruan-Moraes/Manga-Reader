# Codec da renderização — plano e preparação local

MOB-FEAT-020/TASK-002, incremento local de 2026-10-03. Não conclui fontes,
renderer, integração ou aprovação visual. Nenhuma imagem sai do computador.

## Decisão antes do código

Usar as ferramentas oficiais `cwebp`/`dwebp` do libwebp 1.6.0 por um adapter
Java. Não introduzir script Python/C, shell, biblioteca JNI ou download em task.
Executáveis precisam de caminho explícito, SHA-256 e versão conferidos antes
do uso; não pesquisar `PATH` nem escolher outro encoder silenciosamente.

O encoder usa `-lossless -exact -metadata none`, sem resize, near-lossless ou
conversão lossy. `-exact` é necessário também para preservar RGB invisível em
pixels transparentes. Entrada intermediária PAM RGBA preserva esses canais;
encode/decode transferem somente uma linha por vez no Java. O original não é
sobrescrito. [Manual oficial cwebp](https://developers.google.com/speed/webp/docs/cwebp)
e [dwebp](https://developers.google.com/speed/webp/docs/dwebp).

Processo separado permite encerramento por prazo sem execução nativa abandonada
na JVM. Uma capacidade compartilhada, sem fila, impede duas operações nativas
simultâneas. A capacidade só é liberada após confirmação da saída do processo.
Stdout binário tem limite antes de gravar; stderr é descartado, não encaminhado
ao log nem anexado a exceções. Comandos são listas de argumentos, sem shell.

Saída parcial e PAM pertencem exclusivamente à operação e são removidos em
falha. Sucesso devolve arquivo temporário privado e metadados calculados sobre
os bytes finais. Decode verifica hash, MIME, tamanho e dimensões antes do
processo e confere novamente o cabeçalho PAM antes de alocar o raster Java.

## Testes previstos

1. PAM: round-trip de ARGB inclusive transparência, linhas/limites, cabeçalho
   inválido, truncamento, bytes extras e dimensões divergentes antes de alocar.
2. Processos falsos Java: deadline, erro, excesso de saída, concorrência,
   versão/hash incompatíveis e limpeza sem apagar arquivo alheio.
3. Opt-in nativo explícito, sem instalação: WebP real lossless com pixel diff
   exato e hashes/MIME/dimensões, transparência, original preservado, limite
   da saída e entrada adulterada. Testes comuns não dependem do Homebrew.

## Limites desta preparação

Binários Homebrew existentes servem apenas como evidência local, não como pacote
reproduzível de produção. Empacotamento por plataforma, hashes dos artefatos e
licenças transitivas continuam pendentes. As fontes Noto foram adquiridas e
verificadas no [incremento posterior](rendering-fonts.md); não fazem parte da
fotografia inicial do codec. Não se afirma consumo de memória limitado somente por um processo
isolado: libwebp tem buffers nativos próprios; medição e limite do ambiente de
execução continuam obrigatórios em AC-006/TASK-008. Não duplicar raster Java ou
materializar PAM/arquivo final inteiro na heap não é prova de profiling.

Nenhuma mudança de banco, migration, configuração Spring, `/v1`, manifesto OCR,
task ou defaults. A TASK-002 permanece aberta até recursos/codec completos.
