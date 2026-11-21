# Scripts do translation-gateway

Ferramentas locais (Node.js 22 e JDK) de apoio ao gateway. **Nada aqui é executado
pelo runtime do serviço** nem pelo build Maven: são utilitários de validação,
diagnóstico e empacotamento de imagens, sem deploy, push ou chamadas pagas por
padrão. Cada grupo tem seu próprio README.

| Pasta | Para que serve |
| --- | --- |
| [`ocr/`](ocr/README.md) | Avaliação offline de OCR: amostras, execução, diagnóstico, colunas, layout e calibração sintética. |
| [`native-image/`](native-image/README.md) | Preparo do pacote libwebp e do contexto de build das imagens nativas do worker (`Dockerfile.native`), atualização da base Ubuntu. |
| [`single-jre/`](single-jre/README.md) | Política, auditoria do rootfs e verificação de recibos do empacotamento single-JRE. |
| [`visual-review/`](visual-review/README.md) | Galeria HTML de revisão visual da renderização. |
| [`regression/`](../docs/rendering/visual-regression.md#portão-de-regressão-do-corpus) | Captura das entradas do portão de regressão do corpus (Vision congelado + detector + fixtures de render). |
| [`isolation/`](isolation/README.md) | Probe de isolamento do worker (Java), preparo da imagem do probe e checagem do perfil de recursos Terraform. |
| [`runtime/`](runtime/README.md) | Teste estrutural das versões Java/Boot do gateway versus o restante do reactor. |

## Executar os testes

A partir de `api/apps/translation-gateway`:

```bash
node --test scripts/*/*.test.mjs          # todos os grupos
node --test scripts/ocr/*.test.mjs        # um grupo
```

> `runtime/gateway-runtime.test.mjs` falha no baseline: espera `java.version` 25 no
> `pom.xml` do gateway, que hoje declara 23.

## Convenções

- Arquivos `.mjs` seguem o Prettier padrão (`prettier --no-config`).
- Testes ficam ao lado do script (`nome.test.mjs`), usando `node:test`.
- Os caminhos relativos (`import.meta.url`) dependem da profundidade das pastas:
  ao mover um arquivo, ajuste também os `../` e os links nas `docs/`.
- Os Dockerfiles daqui (`native-image/Dockerfile.native`, `isolation/Dockerfile.isolation-probe`)
  são lidos pelos scripts e **não** são o Dockerfile de execução do gateway
  (esse é `../Dockerfile`, usado pelo `../docker-compose.yml`).
