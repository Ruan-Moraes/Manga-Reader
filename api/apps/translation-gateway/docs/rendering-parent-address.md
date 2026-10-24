# Endereço virtual do pai — experimento local, 2026-10-07

Não é mudança de produção. A prova anterior limitava apenas a filha; heap do
worker não limita seus demais mapeamentos. Testar um helper Java exclusivo dos
testes, que aperta RLIMIT_AS do próprio pai **dentro do container possuído**.
Não usar PID arbitrário, root, CAP_SYS_RESOURCE, shell/C próprio ou FFM no pai.

O helper admite somente getppid=1, PID próprio >1, executável igual pelas
ligações fixas do kernel e cgroup privado 0::/ para ambos. Aplica antes do
bootstrap Spring, respeita limite herdado mais restrito, exige VmSize conhecido
e já abaixo do teto, confirma prlimit e relê o limite no pai ao finalizar.
Leitura desconhecida, alvo divergente, recusa ou write ignorado falham sem causa
bruta. Não altera score, CPU ou descritores do pai; encerra antes de renderizar.

Pai e filha têm tetos virtuais de 3 GiB. O cenário específico `parent-bounded`
usa container local de 8 GiB, sem alterar o seletor comum 2/4 GiB, testes antigos,
Terraform ou orçamento operacional. Esse teto só evita misturar a investigação
de dois caps de 3 GiB com o OOM já conhecido do candidato 2 GiB; não é admissão
de produção. Não tratar soma de espaços virtuais como RAM total: temporários,
cache, sockets e outras cargas continuam exigindo limites/evidência próprios.

Preservar as três fixtures máximas no mesmo worker, texto/qualidade/deadlines,
SQL/storage/renderer reais e providers falsos; exigir READY, hashes e redelivery.
Não usar sucesso com maior teto como solução de isolamento. Resultado e limites:
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-parent-address-2026-10-07.md).

Fonte primária: [prlimit/RLIMIT_AS](https://man7.org/linux/man-pages/man2/getrlimit.2.html).
Mudanças do limite de outro processo dependem das credenciais/UIDs permitidas
pelo kernel; esta prova não concede nem supõe privilégio adicional.

Próximo incremento precisa definir/admitir orçamento agregado e falhas de
memória/disco/timeout/cancelamento, sem reduzir imagens/texto/qualidade, repetir
providers ou aumentar RAM cloud para obter verde. 020 in-progress/open,
changes-requested; 021 blocked. Nenhum processo do computador foi alvo do helper.
