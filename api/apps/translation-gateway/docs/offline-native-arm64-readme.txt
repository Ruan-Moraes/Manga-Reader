MOB-FEAT-020: insumos locais ARM64 com base Ubuntu corrigida

Confira o SHA-256 do archive pelo registro externo antes de extrair. Python
3.9+, Node, Docker e o JAR produzido pelo pacote Java sao externos.

Use tools/scripts/offline-oci-archive.py para verificar builder-arm64.tar:
SHA-256 75914164b07694835ff2d7dc66a41e51a98351d73a4584a45e4c501e1e0c58d2,
ID sha256:a5e056701b09317d667148809010b63de2e5398aa3adf1cf85b599b6968c75b2.
Verifique patched-base-arm64.tar com o mesmo script:
SHA-256 079ef84cba0e4292730f3bfb468df4aec212ee795073c71833f0c6e79c126579,
ID sha256:9b8d3a18dc0a468f690cd993a5de1e8020ba25c75d4d5c3dbb9c00f4edb5d82d.
base-proof.json deve ser readonly e ter SHA-256
74bb87ebbb6df54f70c85aa2b7ef5de56c159ccb43a0a6a112b57a579e1de911.
Carregue as imagens localmente e confira os IDs. O script de rebuild recebe
libwebp-1.6.0.tar.gz e um destino absoluto novo; compila sem rede e confere
os hashes do codec e manifesto.

tools/scripts/render-native-image.mjs recebe --jar, --jar-sha256,
--distribution com o pacote reconstruido, --manifest-sha256
bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58,
--platform linux-aarch64-glibc, --base-proof com caminho absoluto do arquivo,
--base-proof-sha256 com o pin acima e --destination absoluto novo. O contexto
registra baseSecurityApproved=false. Construa apenas localmente com a base
verificada, --no-cache, --pull=false e --network=none. A base tem dois patches
Ubuntu; o JRE permanece inalterado e seus findings continuam abertos. Nao ha
aprovacao operacional, publicacao ou ativacao de providers.
