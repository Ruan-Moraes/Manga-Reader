MOB-FEAT-020: insumos locais ARM64 com atualizacao diagnostica Ubuntu

Confira o SHA-256 do arquivo pelo registro externo antes de extrair. Python
3.9+, Node, Docker e o JAR produzido pelo pacote Java sao externos.

Verifique as imagens com tools/scripts/offline-oci-archive.py antes de carrega-las:
builder-arm64.tar SHA-256 75914164b07694835ff2d7dc66a41e51a98351d73a4584a45e4c501e1e0c58d2,
ID sha256:a5e056701b09317d667148809010b63de2e5398aa3adf1cf85b599b6968c75b2;
security-refresh-base-arm64.tar SHA-256 088521b89cabaf0c6080db0a97365b8db6622f2dc2359a5b04e12b2b54cfd023,
ID sha256:befb9e4a225e7b5c98493f759d138275480e92c695319cffc158acd66b5cdff9.
security-refresh-proof.json deve ser readonly e ter SHA-256
cf74729e761e995493ccb475609c3a3b0eef1fb5a8743e19fc00fbb629e2013d.
Carregue as imagens localmente e confira seus IDs. O rebuild recebe
libwebp-1.6.0.tar.gz e um destino absoluto novo; compila sem rede e confere
os hashes do codec e manifesto.

tools/scripts/render-security-refresh-image.mjs recebe --jar, --jar-sha256,
--distribution com o pacote reconstruido, --manifest-sha256
bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58,
--platform linux-aarch64-glibc, --base-proof com caminho absoluto do arquivo,
--base-proof-sha256 com o pin acima e --destination absoluto novo. O contexto
registra baseSecurityApproved=false. Construa apenas localmente com a base
verificada, --no-cache, --pull=false e --network=none. O JRE permanece
inalterado e seus findings continuam abertos; esta base nao esta aprovada
para operacao, publicacao ou ativacao de providers.
