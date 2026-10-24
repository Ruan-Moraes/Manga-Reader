import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, mkdir, writeFile, open } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadSavedDiagnostic,
  readDiagnosticFile as readFile,
} from "./ocr-diagnostic.mjs";
import {
  ALGORITHM,
  MAX_OUTPUT,
  check,
  bounds,
  validateProfile,
  selectedSymbols,
  groupColumns,
} from "./ocr-columns-core.mjs";
import { renderAttribution } from "./ocr-samples.mjs";

const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MARKER = "<!doctype html><!-- Toonlira experimental columns v1 -->";
const MAX_HTML = 16 * 1024 * 1024;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const writeNew = (path, value) =>
  writeFile(path, value, { flag: "wx", mode: 0o600 });
const directory = async (path) => {
  const stat = await lstat(path);
  check(stat.isDirectory() && !stat.isSymbolicLink());
};

async function experimentPath(root, runId, experimentId, reserve = false) {
  check(ID.test(runId) && ID.test(experimentId));
  const run = join(root, "runs", runId);
  for (const path of [dirname(root), root, join(root, "runs"), run])
    await directory(path);
  const parent = join(run, "columns");
  if (reserve)
    await mkdir(parent, { mode: 0o700 }).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
  await directory(parent);
  const path = join(parent, experimentId);
  if (reserve) await mkdir(path, { mode: 0o700 });
  await directory(path);
  return path;
}
export const reserveColumns = (root, runId, id) =>
  experimentPath(root, runId, id, true);

async function profileFile(root, path) {
  check(typeof path === "string" && !path.split(/[\\/]/).includes(".."));
  const absolute = resolve(path),
    rel = relative(resolve(root), absolute);
  check(rel && !rel.startsWith("..") && !rel.startsWith(sep));
  let parent = resolve(root);
  await directory(dirname(parent));
  await directory(parent);
  for (const part of rel.split(sep).slice(0, -1)) {
    parent = join(parent, part);
    await directory(parent);
  }
  return readFile(absolute, 65536);
}

function provenance(saved, runId, diagnosticId) {
  return {
    runId,
    diagnosticId,
    imageSha256: saved.run.request.sample.sha256,
    manifestSha256: saved.run.result.manifestSha256,
    rawResponseSha256: saved.run.result.rawResponse.sha256,
    diagnosticSha256: saved.result.diagnosticSha256,
    synthetic: saved.run.request.mode === "offline",
  };
}

function validateOrder(order, ids, edges) {
  check(Array.isArray(edges));
  const unique = new Set(),
    incoming = new Map(ids.map((id) => [id, 0])),
    outgoing = new Map(ids.map((id) => [id, []]));
  for (const edge of edges) {
    check(Array.isArray(edge) && edge.length === 2);
    const [a, b] = edge;
    check(
      a !== b &&
        incoming.has(a) &&
        incoming.has(b) &&
        !unique.has(JSON.stringify(edge)),
    );
    unique.add(JSON.stringify(edge));
    incoming.set(b, incoming.get(b) + 1);
    outgoing.get(a).push(b);
  }
  const ready = ids.filter((id) => incoming.get(id) === 0);
  let count = 0;
  while (ready.length) {
    const id = ready.shift();
    count++;
    for (const next of outgoing.get(id)) {
      incoming.set(next, incoming.get(next) - 1);
      if (!incoming.get(next)) ready.push(next);
    }
  }
  check(count === ids.length);
  if (order !== null) {
    check(
      Array.isArray(order) &&
        order.length === ids.length &&
        new Set(order).size === ids.length &&
        order.every((id) => incoming.has(id)),
    );
    check(edges.every(([a, b]) => order.indexOf(a) < order.indexOf(b)));
    check(edges.length === (ids.length * (ids.length - 1)) / 2);
  }
}

export function validateColumns(result, diagnostic, profile, source) {
  validateProfile(profile, diagnostic, source);
  check(
    Buffer.byteLength(JSON.stringify(result)) <= MAX_OUTPUT &&
      result.columnsVersion === "1.0" &&
      result.algorithmRevision === ALGORITHM &&
      result.direction === profile.direction,
  );
  check(
    JSON.stringify(result.source) === JSON.stringify(source) &&
      JSON.stringify(result.parameters) === JSON.stringify(profile.parameters),
  );
  const symbols = selectedSymbols(diagnostic, profile),
    ids = new Set(symbols.map((s) => s.path));
  check(
    JSON.stringify(result.originalOrder) ===
      JSON.stringify(symbols.map((s) => s.path)),
  );
  check(
    Array.isArray(result.inventory) &&
      result.inventory.length === ids.size &&
      new Set(result.inventory.map((i) => i.symbolId)).size === ids.size &&
      result.inventory.every((i) => ids.has(i.symbolId)),
  );
  check(
    Array.isArray(result.columns) &&
      result.columns.length <= ids.size / 2 &&
      new Set(result.columns.map((c) => c.id)).size === result.columns.length,
  );
  const accounted = new Set();
  for (const column of result.columns) {
    check(
      /^column-\d+$/.test(column.id) &&
        Array.isArray(column.symbolIds) &&
        column.symbolIds.length >= 2,
    );
    for (const id of column.symbolIds) {
      check(ids.has(id) && !accounted.has(id));
      accounted.add(id);
      check(
        result.inventory.some(
          (i) =>
            i.symbolId === id && i.columnId === column.id && i.reason === null,
        ),
      );
    }
    const b = column.bounds;
    check(
      b &&
        [b.left, b.right, b.top, b.bottom].every(Number.isFinite) &&
        b.left >= 0 &&
        b.top >= 0 &&
        b.right > b.left &&
        b.bottom > b.top &&
        b.right <= diagnostic.widthPx &&
        b.bottom <= diagnostic.heightPx,
    );
    validateOrder(column.order, column.symbolIds, column.precedence);
  }
  for (const item of result.inventory)
    if (item.columnId === null) {
      check(
        !accounted.has(item.symbolId) &&
          [
            "invalid-geometry",
            "multi-character",
            "small-geometry",
            "transitive-bridge",
            "isolated",
          ].includes(item.reason),
      );
      accounted.add(item.symbolId);
    }
  check(accounted.size === ids.size);
  const columnIds = result.columns.map((c) => c.id);
  validateOrder(result.columnOrder, columnIds, result.columnPrecedence);
  check(Array.isArray(result.ambiguities));
  for (const a of result.ambiguities) {
    check(
      [
        "transitive-bridge",
        "overlapping-symbols",
        "overlapping-columns",
        "large-gap",
      ].includes(a.kind),
    );
    if (a.symbolIds)
      check(
        Array.isArray(a.symbolIds) && a.symbolIds.every((id) => ids.has(id)),
      );
    if (a.columnIds)
      check(
        Array.isArray(a.columnIds) &&
          a.columnIds.every((id) => columnIds.includes(id)),
      );
    if (a.columnId) check(columnIds.includes(a.columnId));
    if (a.kind === "large-gap") check(Number.isFinite(a.gapPx) && a.gapPx > 0);
  }
  const state = !result.columns.length
    ? "inconclusive"
    : result.inventory.some((i) => i.columnId === null) ||
        result.ambiguities.length
      ? "partial"
      : "complete";
  check(result.state === state);
  if (state === "complete")
    check(
      result.columnOrder !== null &&
        result.columns.every((c) => c.order !== null),
    );
  return result;
}

export function renderColumns(
  run,
  diagnostic,
  profile,
  result,
  notes = "Revisão pendente.",
) {
  validateColumns(result, diagnostic, profile, result.source);
  const symbols = selectedSymbols(diagnostic, profile),
    byId = new Map(symbols.map((s) => [s.path, s]));
  const token = (id) =>
    `<span class="token"><small>${symbols.findIndex((s) => s.path === id)}</small><b>${escape(byId.get(id).text)}</b><code>${escape(id)}</code></span>`;
  const original = result.originalOrder.map(token).join("");
  const candidates = result.columns
    .map(
      (column) =>
        `<section><h3>${escape(column.id)}</h3><p>${column.order ? "Sequência geométrica determinada dentro deste candidato" : "Ordem parcial — lista abaixo é inventário, não leitura"}</p>${(column.order ?? column.symbolIds).map(token).join("")}<details><summary>Relações de precedência</summary><pre>${escape(JSON.stringify(column.precedence))}</pre></details></section>`,
    )
    .join("");
  const rectangles = result.columns
    .map(
      (c) =>
        `<rect x="${c.bounds.left}" y="${c.bounds.top}" width="${c.bounds.right - c.bounds.left}" height="${c.bounds.bottom - c.bounds.top}"/><text x="${c.bounds.left}" y="${c.bounds.top - 8}">${escape(c.id)}</text>`,
    )
    .join("");
  const polygons = symbols
    .filter((s) => bounds(s, diagnostic))
    .map(
      (s) =>
        `<polygon points="${s.vertices.map((p) => `${p.x},${p.y}`).join(" ")}"/><text x="${s.vertices[0].x}" y="${s.vertices[0].y}">${symbols.indexOf(s)}</text>`,
    )
    .join("");
  const wholePage = `0 0 ${diagnostic.widthPx} ${diagnostic.heightPx}`;
  const validBoxes = symbols.map((s) => bounds(s, diagnostic)).filter(Boolean);
  let focus = wholePage;
  if (validBoxes.length) {
    const left = Math.max(0, Math.min(...validBoxes.map((b) => b.left)) - 30);
    const top = Math.max(0, Math.min(...validBoxes.map((b) => b.top)) - 30);
    const right = Math.min(
      diagnostic.widthPx,
      Math.max(...validBoxes.map((b) => b.right)) + 30,
    );
    const bottom = Math.min(
      diagnostic.heightPx,
      Math.max(...validBoxes.map((b) => b.bottom)) + 30,
    );
    focus = `${left} ${top} ${right - left} ${bottom - top}`;
  }
  // SVG viewport only: no cropped image is generated or sent anywhere.
  const image = (overlay, viewBox = focus) =>
    `<svg viewBox="${viewBox}" role="img" aria-label="Imagem intacta e geometria experimental"><image width="${diagnostic.widthPx}" height="${diagnostic.heightPx}" href="../../../../images/${escape(run.request.sample.file)}"/>${overlay}</svg>`;
  const unresolved = result.inventory
    .filter((i) => i.columnId === null)
    .map((i) => `<li>${token(i.symbolId)} ${escape(i.reason)}</li>`)
    .join("");
  const paragraphs = run.manifest.regions
    .filter((r) => profile.selection.some((s) => s.regionId === r.id))
    .map(
      (r) =>
        `<li>Região ${r.readingOrder}<pre>${escape(r.sourceText)}</pre></li>`,
    )
    .join("");
  const consolidated =
    result.state === "complete"
      ? `<h3>Concatenação experimental, não retorno do provider</h3><pre>${escape(
          result.columnOrder
            .flatMap((id) => result.columns.find((c) => c.id === id).order)
            .map((id) => byId.get(id).text)
            .join(""),
        )}</pre>`
      : "<p>Sem texto consolidado: há pendências ou ambiguidades. Nenhum caractere foi completado.</p>";
  const html = `${MARKER}<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Colunas experimentais</title><style>body{font:16px system-ui;max-width:1600px;margin:auto;padding:1rem}.warning{background:#fff0b3;padding:1rem}.comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}svg{width:100%;max-height:90vh}polygon{fill:none;stroke:#d00040;stroke-width:1;vector-effect:non-scaling-stroke}rect{fill:#0080ff18;stroke:#0050a0;stroke-width:2;vector-effect:non-scaling-stroke}text{font-size:22px;fill:black;stroke:white;stroke-width:1;paint-order:stroke}.token{display:inline-flex;flex-direction:column;border:1px solid #aaa;padding:.4rem;margin:.2rem}.token small{color:#555}.token b{font-size:1.4rem}.token code{font-size:.65rem}pre{white-space:pre-wrap;overflow-wrap:anywhere}section{border-bottom:1px solid #aaa;padding:.5rem}@media(max-width:800px){.comparison{display:block}}</style></head><body><h1>Agrupamento por colunas</h1><p class="warning">Agrupamento experimental — ordem proposta, texto não corrigido; seleção do bloco feita manualmente.</p>
<p>${sourceLabel(run)} Estado: ${escape(result.state)}. Isso não é aprovação de qualidade. Sem tradução, CER ou nota.</p><p>Direção configurada somente para a seleção: vertical-ttb-rtl. Parâmetros: ${escape(JSON.stringify(result.parameters))}.</p><p>Colunas: ${result.columns.length}; símbolos: ${symbols.length}; não resolvidos: ${result.inventory.filter((i) => i.columnId === null).length}. Pequeno não significa furigana confirmado.</p>
<details><summary>Contexto da página inteira, sem transformação</summary>${image(polygons, wholePage)}</details><p>Comparação ampliada da seleção: vermelho = símbolos originais; azul = colunas candidatas. A ampliação é apenas visual, sem recorte de arquivo.</p>
<div class="comparison"><section><h2>Original e sequência capturada</h2>${image(polygons)}<p>Tokens em ordem estrutural; números identificam o inventário original.</p>${original}<details><summary>Texto e quebras originais por região</summary><ol>${paragraphs}</ol></details></section><section><h2>Hipótese geométrica separada</h2>${image(rectangles + polygons)}<p>Ordem entre colunas: ${result.columnOrder ? escape(result.columnOrder.join(" → ")) : "parcial — não resolvida"}. IDs são técnicos, não números de leitura.</p>${candidates}${consolidated}</section></div>
<h2>Símbolos não resolvidos</h2><ul>${unresolved}</ul><h2>Ambiguidades e intervalos vazios</h2><pre>${escape(JSON.stringify(result.ambiguities, null, 2))}</pre><h2>Observações separadas</h2><pre>${escape(notes)}</pre><p>Edite notes.md e regenere este HTML; o navegador não salva notas. Manifesto e captura original permanecem intactos.</p><footer>${renderAttribution(run.request.sample, run.request.credits)}<p>Links externos só acessam a rede quando clicados. Relatório privado.</p></footer></body></html>`;
  check(Buffer.byteLength(html) <= MAX_HTML);
  return html;
}
function sourceLabel(run) {
  return run.request.mode === "offline"
    ? "SIMULAÇÃO — texto não reconhecido da imagem."
    : "OCR real de captura anterior; agrupamento local novo, sem nova chamada.";
}

// The loader seam is only for synthetic filesystem tests; no CLI option overrides it.
export async function runColumns(root, options, load = loadSavedDiagnostic) {
  const runId = options["run-id"],
    diagnosticId = options.diagnostic,
    experimentId = options["experiment-id"];
  const saved = await load(root, runId, diagnosticId),
    source = provenance(saved, runId, diagnosticId);
  const profileBytes = await profileFile(root, options.profile),
    profile = JSON.parse(profileBytes);
  validateProfile(profile, saved.diagnostic, source);
  selectedSymbols(saved.diagnostic, profile);
  const path = await reserveColumns(root, runId, experimentId);
  const git = (args) =>
    execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  await writeNew(
    join(path, "request.json"),
    json({
      version: "1.0",
      runId,
      diagnosticId,
      experimentId,
      source,
      profileSha256: sha(profileBytes),
      algorithmRevision: ALGORITHM,
      algorithmSourceSha256: sha(
        await readFile(
          new URL("ocr-columns-core.mjs", import.meta.url),
          1048576,
        ),
      ),
      gitRevision: git(["rev-parse", "HEAD"]),
      gitDirty: !!git(["status", "--porcelain"]),
      startedAt: new Date().toISOString(),
      nodeVersion: process.version,
      providerCalls: 0,
      credentialReads: 0,
    }),
  );
  await writeNew(join(path, "profile.json"), profileBytes);
  try {
    const result = groupColumns(saved.diagnostic, profile, source);
    validateColumns(result, saved.diagnostic, profile, source);
    const bytes = json(result);
    check(Buffer.byteLength(bytes) <= MAX_OUTPUT);
    const after = await load(root, runId, diagnosticId);
    check(
      JSON.stringify(provenance(after, runId, diagnosticId)) ===
        JSON.stringify(source),
    );
    check(sha(await profileFile(root, options.profile)) === sha(profileBytes));
    await writeNew(join(path, "columns.json"), bytes);
    await writeNew(
      join(path, "result.json"),
      json({
        status: "succeeded",
        columnsSha256: sha(bytes),
        finishedAt: new Date().toISOString(),
      }),
    );
    await writeNew(
      join(path, "notes.md"),
      "# Revisão experimental\n\nRevisão humana pendente. Nenhum texto corrigido ou recuperado.\n",
    );
    return await writeColumnsReport(root, runId, experimentId, load);
  } catch {
    await writeNew(
      join(path, "failure.json"),
      json({
        status: "failed",
        errorCode: "columns-failed",
        finishedAt: new Date().toISOString(),
      }),
    );
    throw new Error("columns-failed");
  }
}

export async function writeColumnsReport(
  root,
  runId,
  experimentId,
  load = loadSavedDiagnostic,
) {
  const path = await experimentPath(root, runId, experimentId);
  const request = JSON.parse(await readFile(join(path, "request.json"), 65536));
  check(
    request.version === "1.0" &&
      request.runId === runId &&
      request.experimentId === experimentId &&
      ID.test(request.diagnosticId),
  );
  const saved = await load(root, runId, request.diagnosticId),
    source = provenance(saved, runId, request.diagnosticId);
  check(JSON.stringify(request.source) === JSON.stringify(source));
  const profileBytes = await readFile(join(path, "profile.json"), 65536);
  check(sha(profileBytes) === request.profileSha256);
  const result = JSON.parse(await readFile(join(path, "result.json"), 65536)),
    bytes = await readFile(join(path, "columns.json"), MAX_OUTPUT);
  check(result.status === "succeeded" && result.columnsSha256 === sha(bytes));
  const profile = JSON.parse(profileBytes),
    columns = JSON.parse(bytes);
  validateColumns(columns, saved.diagnostic, profile, source);
  const html = renderColumns(
    saved.run,
    saved.diagnostic,
    profile,
    columns,
    (await readFile(join(path, "notes.md"), 65536)).toString(),
  );
  const output = join(path, "report.html");
  try {
    const old = await readFile(output, MAX_HTML);
    check(old.toString().startsWith(MARKER));
    const handle = await open(
      output,
      constants.O_WRONLY | constants.O_NOFOLLOW,
    );
    try {
      await handle.truncate(0);
      await handle.writeFile(html);
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeNew(output, html);
  }
  return output;
}
