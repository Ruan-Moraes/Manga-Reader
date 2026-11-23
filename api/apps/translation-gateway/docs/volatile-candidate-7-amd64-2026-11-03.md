# Candidata 7 — prova privada AMD64

Data: 2026-11-03. Evidência técnica parcial; não é aprovação de operação
pública, de qualidade dos providers, nem de conclusão das features 020/021.

A candidata 7 inclui a migration V11 e o contador opcional de tentativas;
seu JAR tem SHA-256
`7e3bd84a2c8263959d5d022f6401d4ba2807d684cc72da98e4c4a23b1dffaeb3`.
A rodada `mob020-c7-7f08d3ae` usou imagem Linux AMD64 em COS125, VM
`e2-highmem-2`, Docker 27.5.1, cgroup v2, sem IP público e sem acesso aos
providers pagos. A identidade temporária tinha leitura apenas do registry
dedicado. O pipeline retornou zero; os arquivos operacionais e métricas
coletados por frames com checksum estão em
`.local/toonlira-public-test-20261103/amd64-c7c/evidence/volatile/`.

O relatório HTTP registra 12 chamadas OCR e 11 de tradução simuladas, entrada
de 12 MiB, pico agregado de 1.728.692.224 bytes, limite de memória 8 GiB,
swap zero, 64 PIDs, 2 CPUs e limite de espaço de endereçamento do pai de
3 GiB. Não registrou arquivos de conteúdo ou jobs legados persistidos. O
cenário de restart também terminou com zero violações de inline e zero arquivos
de conteúdo. Os oito relatórios nativos apresentam `outcome=passed`; o
contador de OOM do host permaneceu em zero antes e depois. Esses valores são
das fixtures sintéticas, não de uma tradução paga.

O inventário final confirmou zero VM, disco, rede, sub-rede e identidade da
rodada e nenhuma concessão temporária remanescente no registry ou IAM do
projeto. O registry e os recursos de controle da implantação pública
permanecem, conforme o planejamento separado.

Uma tentativa anterior criou e removeu a VM, mas a coleta falhou devido ao
caminho REST incorreto da porta serial; outra terminou antes da VM porque a
identidade ainda não havia propagado. Seus registros permanecem em
`.local/toonlira-public-test-20261103/amd64-c7/` e `amd64-c7b/`, sem aceite
retroativo. Ambas tiveram seus recursos removidos e ausência confirmada.

Esta rodada não executou cancelamento explícito no alvo, teste Android real,
prova de acessibilidade física, provider real, TLS público ou a nova
composição com limitador. O controle de tentativas V11 foi testado no backend
em PostgreSQL real, mas não foi habilitado neste harness da matriz. TASK-005,
TASK-006 e auditoria final continuam abertas; a prova c6 histórica e sua
falha c5 permanecem inalteradas.

## Prova posterior de cancelamento nativo

A rodada privada separada `mob020-cancel-42ec1af3` usou o mesmo JAR e
providers simulados, em AMD64/COS125 sem IP público. O teste sintético parou
um processo filho nativo sob controle do harness, interrompeu explicitamente
o dono da sessão e verificou o encerramento do filho, ausência de entrega
tardia, recuperação da capacidade e ausência de arquivos regulares no
scratch. O resultado `volatile-native-cancellation-passed` e o código zero
foram coletados em `.local/toonlira-public-test-20261103/amd64-cancel-b/`.
SHA-256: fonte do probe
`1dd00572fc20f43bb73ba4b0854d8fb887eeff4bfbf90925ba2d5b6563bf36c3`,
classe compilada
`dca0b8af0570fece2fda855598f1d452dfd8021a760fc27e5efdbcea5664b747`,
harness AMD64
`9732ceb4a100ca2a5c2a82c1ae821addfb01871a0a79ac2e3c5e381d21ff8c70`,
pipeline `4d86565cf1f492cbcb5b6afdfc87d41ce0f147732d88c44aeda12d6d741ecc91`
e log de resultado
`1769f2a64d7c40311cdf2c8b1ccc0a8eb78c9b9be627c53df7bfe8c9497558d5`.
O inventário final mostrou zero VM, disco, rede, sub-rede e identidade dessa
rodada, sem binding temporário no registry ou no IAM do projeto. Esta prova
não demonstra cancelamento por desconexão HTTP ou pelo Android.

Uma preparação anterior da prova de cancelamento terminou antes de criar a
VM: a identidade inicialmente não aparecia na consulta e surgiu após a
limpeza. Ela foi posteriormente identificada e removida; o inventário
confirmou sua ausência. O código de preparação passou a conferir o recibo de
criação e aguardar a propagação. As tasks permanecem abertas para revisão das
evidências e verificações pendentes.
