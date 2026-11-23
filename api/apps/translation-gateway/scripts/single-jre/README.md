# single-jre/

Verificação do empacotamento **single-JRE** do worker: regras do que pode entrar
no rootfs, auditoria física dos archives e prova (recibo) final. Docs:
[`single-jre-packaging`](../../docs/native-runtime/single-jre-packaging-2026-10-11.md),
[`rootfs-archive-audit`](../../docs/native-runtime/rootfs-archive-audit-2026-10-11.md).

| Arquivo | Função |
| --- | --- |
| `single-jre-policy.mjs` | Política: padrões de exclusão e verificação de entradas, hardlinks e mtree. |
| `rootfs-archive-audit.mjs` | Lê os archives do rootfs (inventário de caminhos, filtro sem reescrita, auditoria). |
| `single-jre-proof.mjs` | Verifica o recibo completo (`verifySingleJreProof`) combinando política e auditoria. |
| `test-support/rootfs-archive-fixture.mjs` | Helpers de teste que constroem archives tar sintéticos. |
| `*.test.mjs` | Testes. |
