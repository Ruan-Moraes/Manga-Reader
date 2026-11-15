# Documentação do translation-gateway

Organizada por assunto. Documentos datados são registros históricos (ver [política de documentação](../../../../docs/documentation-policy.md)); comandos e scripts ficam em [`scripts/`](../scripts/README.md).

| Pasta | Conteúdo |
| --- | --- |
| [`architecture/`](architecture/README.md) | **Arquitetura e ciclo de vida** — Contratos de tradução, entrega/expiração de resultados, retenção, cleanup e rascunhos de política. Maioria são decisões e planos; os datados são registros históricos. |
| [`rendering/`](rendering/README.md) | **Renderização** — Contratos do renderer, codec, fontes, composição, worker, persistência, imagem nativa e validações de nuvem. Documentos datados são registros históricos. |
| [`native-runtime/`](native-runtime/README.md) | **Runtime nativo (Java 25, JRE único, base de imagem)** — Migração Java 25/Boot 4, imagem nativa, single-JRE, auditoria de rootfs e fontes Ubuntu. Registros datados de out/2026; o `pom.xml` atual declara Java 23. |
| [`security/`](security/README.md) | **Segurança** — Triagens e revisões de segurança do gateway (registros datados). |
| [`worker-isolation/`](worker-isolation/README.md) | **Prova de isolamento do worker (Cloud Run / VM)** — Evidências de isolamento do worker, quase todas de out/2026. São registros históricos: não editar o conteúdo; ordem alfabética por fase (`n1`, `n2`, `prepull`, `import`, `spot`, `vm`, ...). |
| [`ocr-evaluation/`](ocr-evaluation/README.md) | **Avaliação de OCR e layout** — Protocolo, catálogo, calibração, experimentos de layout e diagnósticos offline. |

**Auditoria em aberto:** [`auditoria-2026-11-15.md`](auditoria-2026-11-15.md) — roteiro para auditar a qualidade
visual, OCR, inpainting, letreiros, camada Gemini, regressão visual e infraestrutura de dev (2026-11-14 → 15).

## Pendência

O `pom.xml` e o `Dockerfile` do gateway usam Java 23, enquanto os documentos de `native-runtime/` e `rendering/` (e `scripts/runtime/gateway-runtime.test.mjs`) assumem Java 25. Decisão de alinhamento pendente.
