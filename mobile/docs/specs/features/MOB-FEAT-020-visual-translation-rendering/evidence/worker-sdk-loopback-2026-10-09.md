# Clients oficiais no pipeline local — 2026-10-09 UTC

Parcela de TASK-007/008 e AC-004/005/006. Só testes Java e governança mudaram;
runtime, migrations V1–V9, defaults e cloud não mudaram. 020 continua
`in-progress/open`, verdict `changes-requested`; 021 `approved/blocked`.
Performance mobile não aplicável: nenhuma alteração de runtime mobile.

## Prova executada

[RenderingWorkerIntegrationTest](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/RenderingWorkerIntegrationTest.java),
método `officialSdkTransportsTraverseTheWorkerWithoutCredentialsOrRepeatedCalls`:
controller real por MockMvc com filtros, perfil worker, PostgreSQL 17 isolado,
storage local e renderer local com fontes/codec reais. Nos seams de testes,
as portas delegam aos adapters Vision e Cloud Translation e clients oficiais;
os transports usam apenas servidores gRPC em loopback e NoCredentialsProvider.
Não é bootstrap do bean cloud, acesso GCS ou chamada ao Google. A URI GCS
sintética só é verificada no request recebido localmente, sem leitura remota.

| Cenário sintético                 | Estado observado                                                            | Chamadas Vision/Translation após reentrega |
| --------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| Uma região                        | READY, três etapas SUCCEEDED, imagem/manifesto recuperados com hash íntegro | 1/1                                        |
| Página vazia                      | READY, zero regiões, sem tradução                                           | 1/0                                        |
| Vision UNAVAILABLE                | FAILED/ocr-unavailable, sem artefatos finais                                | 1/0                                        |
| Translation aceita e não responde | FAILED/translation-unavailable, sem artefatos finais                        | 1/1                                        |

O teste verifica I/O de provider fora de transação, URI derivada da chave do job,
request OCR sem bytes, remoção do original remoto e hash da cópia reutilizável
preservado. Rotas públicas continuam inacessíveis no worker. Logs capturados
não contêm mensagem bruta sintética, URI, chave, jobRef ou path reutilizável.
Servidores/clients são fechados ao final de cada cenário.

O retorno traduzido local ecoa `Hello`: não comprova tradução nem qualidade OCR.
Imagem branca de 100×80 e texto/geometry de resposta são inteiramente sintéticos.
Sem imagem privada, ADC, credencial, rede Google, custo ou download.

## Reprodução e fotografia

No reactor `api`, com Docker local e CLI libwebp 1.6.0 já verificados:

```text
./mvnw -o -q -pl apps/translation-gateway -am test
  -Dtest=RenderingWorkerIntegrationTest
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.native.enabled=true
  -Drenderer.cwebp.path=<encoder local verificado>
  -Drenderer.cwebp.sha256=<hash verificado>
  -Drenderer.dwebp.path=<decoder local verificado>
  -Drenderer.dwebp.sha256=<hash verificado>
```

Linhas acima representam argumentos de um único comando. Paths absolutos são
locais, não instalados automaticamente. Pins/preparação existentes no
[protocolo do codec](../../../../../../api/apps/translation-gateway/docs/rendering-codec.md).
Foco inicial: quatro testes/zero failures/errors/skips. Depois das asserções
de logs, suíte completa recompilada: 27 testes/zero failures/errors/skips.
Não houve correção de produção nem red artificial: é evidência complementar
de comportamento existente, não finding funcional corrigido.

Fonte/testes/config: 371 arquivos, SHA-256
`98702c9df58c64fe1f3fddb8b9489035c51c74a6ac6b4f3bf1882c8a135ef0c6`.
JAR de runtime inalterado:
`954b42c29bf71ec316e29d59c87e133d6b2b7541fbf69564a5eb77a234a091cd`.
Checksum mobile SDD separado; matrizes nativas anteriores não foram reexecutadas
ou reatribuídas. Gates globais terminais ficam na review desta parcela.

## Pendências preservadas

Esta prova não mede memória residente, transporte de produção, páginas máximas
com SDKs, GCS/Tasks, operação cloud ou qualidade linguística. ONNX nos runtimes
Linux preparados ainda falha conforme a
[evidência de bootstrap](layout-runtime-bootstrap-2026-10-09.md).
Preparação Java/glibc aguarda aprovação específica, sem troca silenciosa.
Orçamento agregado, qualidade e operação continuam abertos; não promover a 020.
