# Segurança da base nativa — próximo incremento

Triagem em 2026-10-10, complementar à
[migração Boot 4](boot4-execution-2026-10-10.md). Nenhuma instalação, rebuild
de base ou mudança de pacote OS foi executada aqui. Zero alertas Java no novo
scan não aprova OS, cópias embarcadas no JRE ou libwebp distribuído manualmente.

Resolução posterior: a instalação limitada dos dois pacotes foi autorizada e
executada somente em novas bases locais, conforme
[evidência de 2026-10-11](native-base-update-2026-10-11.md). As versões/tabelas
abaixo preservam a triagem anterior, não o inventário das imagens novas.

A [triagem residual posterior](native-residual-security-2026-10-11.md) registra
as condições dos findings, bibliotecas efetivamente observadas no probe sintético
e um candidato de runtime ainda não instalado. Não é aprovação de segurança.

## Correções identificadas

| Superfície Ubuntu 24.04          | Versão na imagem                         | Correção indicada pelo fornecedor               | Situação                                                                      |
| -------------------------------- | ---------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `libfreetype6`, CVE-2026-95512   | `2.13.2+dfsg-1ubuntu0.1`                 | `2.13.2+dfsg-1ubuntu0.2`                        | Patch identificado, não instalado.                                            |
| `libpng16-16t64`, CVE-2026-46675 | `1.6.43-5ubuntu0.6`                      | `1.6.43-5ubuntu0.7`                             | Patch identificado, não instalado.                                            |
| zlib, CVE-2026-85091             | Pacote Ubuntu e cópia JRE são distintos. | Ubuntu registra vulnerável com correção adiada. | Analisar backport/reachability separadamente; não prometer resolução por APT. |

Fontes primárias: [FreeType](https://ubuntu.com/security/CVE-2026-95512),
[libpng](https://ubuntu.com/security/CVE-2026-46675) e
[zlib](https://ubuntu.com/security/CVE-2026-85091). A página libpng falhou duas
vezes ao abrir diretamente; seu conteúdo foi obtido pela busca do mesmo item
no domínio oficial. Não houve consulta a fonte secundária para fixar a versão.

Não extrapolar os patches da distribuição para as versões embarcadas no JRE
registradas no [inventário Java 25](java25-native-inventory.json). Fontes
verificadas/restrições de formatos podem limitar condições de exploração, mas
não são VEX aprovado nem justificativa para suprimir os alertas restantes.

## Execução futura proposta

Requer confirmação **de instalação adicional** antes de baixar/instalar os
pacotes fora do incremento Boot 4 já autorizado:

1. Preparar uma base derivada local, sem alterar macOS, bases anteriores ou
   imagens históricas. Verificar origem, assinatura APT, versões e hashes de
   todos os pacotes realmente resolvidos, incluindo dependências adicionais.
2. Não executar upgrade abrangente ou substituir bibliotecas do JRE por
   arquivos da distribuição. Se a resolução exigir outros pacotes/runtime,
   apresentar essa instalação antes de prosseguir.
3. Registrar digest da nova base e inventário separado OS/JRE/codec; não apontar
   produção para uma tag mutável ou reclassificar a base antiga como corrigida.
4. Reconstruir imagens locais, repetir preflight, matrizes nativas e scan com
   DB identificada. Conferir cada finding residual, sem ignorefile seletivo.
5. Atualizar pins/configuração somente com evidência real. Sem push, deploy,
   cloud, providers, credenciais ou mudança dos defaults operacionais.

Mesmo após esses dois patches, os demais alertas OS e a cópia zlib do JRE
continuam sujeitos a análise. Memória/admissão cloud e qualidade humana são
gates próprios; não são resolvidos por reduzir a contagem de CVEs.
