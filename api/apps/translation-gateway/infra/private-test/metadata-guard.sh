#!/bin/sh
# Run only on the dedicated test VM, before starting any proxy container.
set -eu
chain=TOONLIRA_TEST_META
iptables -w -nL DOCKER-USER >/dev/null
if ! iptables -w -nL "$chain" >/dev/null 2>&1; then
    iptables -w -N "$chain"
fi
for source in 172.30.242.2 172.30.243.2; do
    if ! iptables -w -C "$chain" -s "$source/32" -d 169.254.169.254/32 -j DROP 2>/dev/null; then
        iptables -w -I "$chain" 1 -s "$source/32" -d 169.254.169.254/32 -j DROP
    fi
    iptables -w -C "$chain" -s "$source/32" -d 169.254.169.254/32 -j DROP
done
# Docker's embedded resolver forwards DNS through the metadata IP. Permit only
# DNS to that address; all other protocols and ports remain blocked above.
# Reinsert each rule at the front so prior installations cannot leave it below
# a DROP rule. The chain belongs exclusively to this deployment.
for source in 172.30.242.2 172.30.243.2; do
    for protocol in udp tcp; do
        while iptables -w -C "$chain" -s "$source/32" -d 169.254.169.254/32 -p "$protocol" --dport 53 -j ACCEPT 2>/dev/null; do
            iptables -w -D "$chain" -s "$source/32" -d 169.254.169.254/32 -p "$protocol" --dport 53 -j ACCEPT
        done
        iptables -w -I "$chain" 1 -s "$source/32" -d 169.254.169.254/32 -p "$protocol" --dport 53 -j ACCEPT
        iptables -w -C "$chain" -s "$source/32" -d 169.254.169.254/32 -p "$protocol" --dport 53 -j ACCEPT
    done
done
# A rule anywhere after Docker's RETURN is ineffective; install our jump first.
first=$(iptables -w -S DOCKER-USER | awk '/^-A DOCKER-USER / {print; exit}')
if [ "$first" != "-A DOCKER-USER -j $chain" ]; then
    iptables -w -I DOCKER-USER 1 -j "$chain"
fi
first=$(iptables -w -S DOCKER-USER | awk '/^-A DOCKER-USER / {print; exit}')
[ "$first" = "-A DOCKER-USER -j $chain" ]
printf '%s\n' metadata-guard-installed
