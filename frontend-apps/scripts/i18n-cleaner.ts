#!/usr/bin/env node
/**
 * i18n-cleaner — audita e limpa chaves de tradução órfãs.
 *
 * Etapas:
 *   1. Varre /src em busca de chamadas t('chave')
 *   2. Consolida chaves usadas (Set)
 *   3. Lê JSONs de i18n e achata em chaves completas
 *   4. Identifica chaves órfãs (existem no JSON, ausentes no código)
 *   5. Gera relatório
 *   6. Remove órfãs (com --force), poda objetos vazios
 *   7. Segurança: --dry-run, --backup, logs
 *
 * Uso:
 *   node scripts/i18n-cleaner.js [opções]
 *   npm run i18n:clean -- --dry-run
 *
 * Opções:
 *   --src <dir>        Pasta de código-fonte           (default: src)
 *   --i18n <dir>       Pasta dos JSONs de tradução      (default: src/assets/i18n)
 *   --dry-run          Só relatório, sem alterar arquivos
 *   --force            Executa limpeza sem confirmação
 *   --backup           Cria .bak antes de salvar
 *   --ignore <list>    Prefixos de chave a preservar (csv), ex: errors.,dynamic.
 *   -h, --help         Ajuda
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ---------------------------------------------------------------------------
// CLI / Config
// ---------------------------------------------------------------------------

interface Options {
  srcDir: string;
  i18nDir: string;
  dryRun: boolean;
  force: boolean;
  backup: boolean;
  ignorePrefixes: string[];
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    srcDir: 'src',
    i18nDir: 'src/assets/i18n',
    dryRun: false,
    force: false,
    backup: false,
    ignorePrefixes: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--src':       opts.srcDir = argv[++i]; break;
      case '--i18n':      opts.i18nDir = argv[++i]; break;
      case '--dry-run':   opts.dryRun = true; break;
      case '--force':     opts.force = true; break;
      case '--backup':    opts.backup = true; break;
      case '--ignore':    opts.ignorePrefixes = (argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean); break;
      case '-h':
      case '--help':      printHelp(); process.exit(0);
      default:
        if (a.startsWith('--')) { console.error(`Opção desconhecida: ${a}`); process.exit(1); }
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(`
i18n-cleaner — remove chaves de tradução não utilizadas

Uso: node scripts/i18n-cleaner.js [opções]

  --src <dir>      Pasta de código-fonte        (default: src)
  --i18n <dir>     Pasta dos JSONs i18n          (default: src/assets/i18n)
  --dry-run        Apenas relatório, sem alterar
  --force          Limpa sem pedir confirmação
  --backup         Cria backup .bak dos JSONs
  --ignore <csv>   Prefixos a preservar (ex: errors.,api.)
  -h, --help       Esta ajuda
`);
}

// ---------------------------------------------------------------------------
// Util — varredura de diretórios
// ---------------------------------------------------------------------------

const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html']);

function walk(dir: string, accept: (file: string) => boolean): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      out.push(...walk(full, accept));
    } else if (accept(full)) {
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Etapa 1+2 — extrair chaves usadas no código
// ---------------------------------------------------------------------------

// captura t('a.b'), t("a.b"), t(`a.b`) e i18n.t(...), $t(...), translate(...)
const T_CALL = /(?:\$t|i18n\.t|translate|\bt)\(\s*(['"`])([^'"`]+?)\1/g;

export interface UsedKeys {
  /** Chaves estáticas exatas (já sem prefixo de namespace `ns:`). */
  exact: Set<string>;
  /** Prefixos estáticos de chaves dinâmicas — t(`a.b.${x}`) → "a.b.". Wildcard. */
  wildcards: string[];
}

/**
 * Remove prefixo de namespace i18next (`common:foo.bar` → `foo.bar`).
 * Arquivos são por-namespace e armazenam chaves bare, então comparamos bare.
 */
function stripNamespace(key: string): string {
  const i = key.indexOf(':');
  return i === -1 ? key : key.slice(i + 1);
}

function collectUsedKeys(srcDir: string): UsedKeys {
  const exact = new Set<string>();
  const wildcards = new Set<string>();
  const files = walk(srcDir, f => CODE_EXT.has(path.extname(f)));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    T_CALL.lastIndex = 0;
    while ((m = T_CALL.exec(content)) !== null) {
      const raw = stripNamespace(m[2]);
      const interp = raw.indexOf('${');
      if (interp === -1) {
        exact.add(raw);
      } else {
        // chave dinâmica: preserva tudo que comece pelo trecho estático
        wildcards.add(raw.slice(0, interp));
      }
    }
  }
  return { exact, wildcards: [...wildcards] };
}

/** Chave do JSON é considerada usada se bate exato ou cai sob um wildcard. */
function isUsed(key: string, used: UsedKeys): boolean {
  if (used.exact.has(key)) return true;
  return used.wildcards.some(w => key.startsWith(w));
}

// ---------------------------------------------------------------------------
// Etapa 3 — achatar JSON em chaves completas
// ---------------------------------------------------------------------------

type Json = { [k: string]: any };

function flatten(obj: Json, prefix = '', out = new Set<string>()): Set<string> {
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, full, out);
    } else {
      out.add(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Etapa 6 — remover chave do objeto + podar objetos vazios
// ---------------------------------------------------------------------------

function deleteKey(obj: Json, dotted: string): boolean {
  const parts = dotted.split('.');
  const last = parts.pop()!;
  let node = obj;
  const chain: Json[] = [obj];
  for (const p of parts) {
    if (node[p] == null || typeof node[p] !== 'object') return false;
    node = node[p];
    chain.push(node);
  }
  if (!(last in node)) return false;
  delete node[last];

  // poda objetos vazios de baixo pra cima
  for (let i = chain.length - 1; i > 0; i--) {
    if (Object.keys(chain[i]).length === 0) {
      const parentKey = parts[i - 1];
      delete chain[i - 1][parentKey];
    } else {
      break;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Detecta indentação do arquivo original
// ---------------------------------------------------------------------------

function detectIndent(raw: string): string | number {
  const m = raw.match(/^[ \t]+(?=["{])/m) || raw.match(/\n([ \t]+)\S/);
  if (m) {
    const ws = m[1] ?? m[0];
    if (ws.includes('\t')) return '\t';
    return ws.length || 2;
  }
  return 2;
}

// ---------------------------------------------------------------------------
// Confirmação interativa
// ---------------------------------------------------------------------------

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, ans => {
      rl.close();
      resolve(/^s|^y/i.test(ans.trim()));
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface I18nFile {
  path: string;
  data: Json;
  indent: string | number;
  keys: Set<string>;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  console.log('🔍 i18n-cleaner\n');

  // Etapa 1+2
  const used = collectUsedKeys(opts.srcDir);

  // Etapa 3 — carrega cada JSON
  const jsonFiles = walk(opts.i18nDir, f => path.extname(f) === '.json');
  if (jsonFiles.length === 0) {
    console.error(`Nenhum JSON encontrado em "${opts.i18nDir}".`);
    process.exit(1);
  }

  const files: I18nFile[] = [];
  const allI18nKeys = new Set<string>();
  for (const fp of jsonFiles) {
    const raw = fs.readFileSync(fp, 'utf8');
    const data = JSON.parse(raw) as Json;
    const keys = flatten(data);
    keys.forEach(k => allI18nKeys.add(k));
    files.push({ path: fp, data, indent: detectIndent(raw), keys });
  }

  // Etapa 4 — órfãs (por arquivo, respeitando prefixos ignorados)
  const isIgnored = (k: string) => opts.ignorePrefixes.some(p => k.startsWith(p));
  const orphansGlobal = new Set<string>();
  for (const k of allI18nKeys) {
    if (!isUsed(k, used) && !isIgnored(k)) orphansGlobal.add(k);
  }

  // Etapa 5 — relatório
  console.log(`✓ Chaves utilizadas no código: ${used.exact.size} (+${used.wildcards.length} padrões dinâmicos)`);
  console.log(`✓ Chaves existentes no i18n:   ${allI18nKeys.size}`);
  console.log(`✓ Chaves órfãs:                ${orphansGlobal.size}\n`);

  if (orphansGlobal.size === 0) {
    console.log('Nada a remover. 🎉');
    return;
  }

  console.log('Chaves órfãs:');
  [...orphansGlobal].sort().forEach(k => console.log(`  - ${k}`));
  console.log('\nArquivos afetados:');
  for (const f of files) {
    const n = [...orphansGlobal].filter(k => f.keys.has(k)).length;
    if (n) console.log(`  ${f.path}  (${n} chaves)`);
  }
  console.log('');

  // Etapa 7 — segurança
  if (opts.dryRun) {
    console.log('--dry-run: nenhuma alteração feita.');
    return;
  }

  if (!opts.force) {
    const ok = await confirm('Remover as chaves órfãs? (s/N) ');
    if (!ok) { console.log('Cancelado.'); return; }
  }

  // Etapa 6 — remoção
  let removedTotal = 0;
  for (const f of files) {
    let removed = 0;
    for (const k of orphansGlobal) {
      if (deleteKey(f.data, k)) removed++;
    }
    if (removed === 0) continue;

    if (opts.backup) {
      fs.copyFileSync(f.path, `${f.path}.bak`);
      console.log(`  backup: ${f.path}.bak`);
    }

    const out = JSON.stringify(f.data, null, f.indent) + '\n';
    fs.writeFileSync(f.path, out, 'utf8');
    removedTotal += removed;
    console.log(`  ✓ ${f.path}: ${removed} chaves removidas`);
  }

  console.log(`\nConcluído. ${removedTotal} remoções em ${files.length} arquivos.`);
}

main().catch(err => { console.error(err); process.exit(1); });
