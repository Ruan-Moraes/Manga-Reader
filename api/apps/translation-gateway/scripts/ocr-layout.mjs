import { renderAttribution } from "./ocr-samples.mjs";
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRun } from "./ocr-evaluation.mjs";

const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MODEL_SHA =
  "065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195";
const MARKER = "<!doctype html><!-- Toonlira experimental layout v1 -->";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (value) => {
  if (!value)
    throw new Error("Layout: configuração, caminho ou artefato inválido.");
};
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function directory(path) {
  const stat = await lstat(path);
  check(stat.isDirectory() && !stat.isSymbolicLink());
}
async function file(path, max) {
  const stat = await lstat(path);
  check(stat.isFile() && !stat.isSymbolicLink() && stat.size <= max);
  return readFile(path);
}
export async function reserveAnalysis(root, runId, analysisId) {
  check(ID.test(runId) && ID.test(analysisId));
  for (const path of [
    dirname(root),
    root,
    join(root, "runs"),
    join(root, "runs", runId),
  ])
    await directory(path);
  const parent = join(root, "runs", runId, "layouts");
  await mkdir(parent, { mode: 0o700 }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
  await directory(parent);
  const path = join(parent, analysisId);
  await mkdir(path, { mode: 0o700 });
  return path;
}

export function layoutEnvironment(options, model, parent = process.env) {
  const env = Object.fromEntries(
    Object.entries(parent).filter(
      ([key]) =>
        !/^(SPRING_|GATEWAY_|LOGGING_|OCR_EVAL_|OCR_LAYOUT_|GOOGLE_|GCLOUD_|CLOUDSDK_|JAVA_TOOL_OPTIONS$|JDK_JAVA_OPTIONS$|_JAVA_OPTIONS$|MAVEN_OPTS$|MAVEN_ARGS$)/.test(
          key,
        ),
    ),
  );
  return {
    ...env,
    OCR_LAYOUT_RUN_ID: options["run-id"],
    OCR_LAYOUT_ANALYSIS_ID: options["analysis-id"],
    OCR_LAYOUT_DIRECTION: options.direction,
    OCR_LAYOUT_MODEL: model,
  };
}

export function validateLayout(bytes, result, run) {
  check(bytes.length <= 1048576 && hash(bytes) === result.layoutSha256);
  const layout = JSON.parse(bytes);
  check(
    ["1.0", "1.1"].includes(layout.layoutVersion) &&
      layout.imageSha256 === run.request.sample.sha256 &&
      layout.ocrManifestSha256 === run.result.manifestSha256 &&
      ["ltr", "rtl"].includes(layout.direction) &&
      ["complete", "partial", "inconclusive"].includes(layout.state),
  );
  check(
    layout.model?.sha256 === MODEL_SHA &&
      Array.isArray(layout.panels) &&
      layout.panels.length <= 128 &&
      Array.isArray(layout.bubbles) &&
      layout.bubbles.length <= 256 &&
      Array.isArray(layout.associations) &&
      layout.associations.length <= 1024,
  );
  const ids = new Set(run.manifest.regions.map((region) => region.id));
  check(
    layout.associations.length === ids.size &&
      new Set(layout.associations.map((link) => link.regionId)).size ===
        ids.size,
  );
  const panelIds = new Set(layout.panels.map((item) => item.id)),
    bubbleIds = new Set(layout.bubbles.map((item) => item.id));
  check(
    panelIds.size === layout.panels.length &&
      bubbleIds.size === layout.bubbles.length,
  );
  const suppressed =
    layout.layoutVersion === "1.1" ? layout.suppressedBubbles : [];
  check(
    Array.isArray(suppressed) &&
      layout.bubbles.length + suppressed.length <= 256,
  );
  const original = [
    ...layout.bubbles,
    ...suppressed.map((item) => item?.bubble),
  ];
  check(original.every(Boolean));
  check(new Set(original.map((b) => b.id)).size === original.length);
  for (const bubble of original)
    check(
      Number.isFinite(bubble.confidence) &&
        bubble.confidence >= 0.5 &&
        bubble.confidence <= 1,
    );
  for (const box of [...layout.panels, ...original]) {
    const b = box.bounds;
    check(
      typeof box.id === "string" &&
        box.id.trim().length > 0 &&
        box.id.length <= 128 &&
        b &&
        [b.left, b.top, b.right, b.bottom].every(Number.isFinite) &&
        b.left >= 0 &&
        b.top >= 0 &&
        b.right <= 1 &&
        b.bottom <= 1 &&
        b.right > b.left &&
        b.bottom > b.top,
    );
  }
  if (layout.layoutVersion === "1.1") validateSuppression(layout, original);
  for (const link of layout.associations)
    check(
      ids.has(link.regionId) &&
        Array.isArray(link.panelCandidates) &&
        Array.isArray(link.bubbleCandidates) &&
        link.panelCandidates.every((id) => panelIds.has(id)) &&
        link.bubbleCandidates.every((id) => bubbleIds.has(id)),
    );
  check(
    Array.isArray(layout.groups) &&
      Array.isArray(layout.ambiguities) &&
      Array.isArray(layout.unassociated) &&
      Array.isArray(layout.suggestedOrder) &&
      new Set(layout.suggestedOrder).size === layout.suggestedOrder.length,
  );
  for (const group of layout.groups)
    check(
      bubbleIds.has(group.bubbleId) &&
        Array.isArray(group.regionIds) &&
        group.regionIds.every((id) => ids.has(id)),
    );
  for (const ambiguity of layout.ambiguities)
    check(
      Array.isArray(ambiguity.regionIds) &&
        ambiguity.regionIds.every((id) => ids.has(id)),
    );
  check(
    [...layout.unassociated, ...layout.suggestedOrder].every((id) =>
      ids.has(id),
    ),
  );
  return layout;
}

function validateSuppression(layout, original) {
  check(
    layout.algorithmRevision === "white-gutters-1-dedup-1" &&
      layout.parameters?.duplicateIou === 0.95,
  );
  const compare = (a, b) =>
    b.confidence - a.confidence ||
    a.bounds.left - b.bounds.left ||
    a.bounds.top - b.bounds.top ||
    a.bounds.right - b.bounds.right ||
    a.bounds.bottom - b.bounds.bottom ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const iou = (a, b) => {
    const intersection =
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return (
      intersection /
      ((a.right - a.left) * (a.bottom - a.top) +
        (b.right - b.left) * (b.bottom - b.top) -
        intersection)
    );
  };
  const retained = [],
    suppressed = [];
  for (const bubble of original.toSorted(compare)) {
    const winner = retained.find((b) => iou(b.bounds, bubble.bounds) >= 0.95);
    if (winner)
      suppressed.push({
        bubble,
        retainedBubbleId: winner.id,
        iou: iou(winner.bounds, bubble.bounds),
        reason: "near-duplicate",
      });
    else retained.push(bubble);
  }
  check(
    retained.length === layout.bubbles.length &&
      suppressed.length === layout.suppressedBubbles.length,
  );
  retained.forEach((b, i) => check(b.id === layout.bubbles[i].id));
  suppressed.forEach((expected, i) => {
    const actual = layout.suppressedBubbles[i];
    check(
      actual.bubble.id === expected.bubble.id &&
        actual.retainedBubbleId === expected.retainedBubbleId &&
        actual.reason === expected.reason &&
        Number.isFinite(actual.iou) &&
        Math.abs(actual.iou - expected.iou) < 1e-12,
    );
  });
}

export function renderLayoutReport(run, result, layout) {
  const regions = run.manifest?.regions ?? [];
  const number = (id) => regions.findIndex((region) => region.id === id);
  const shape = (item, css) =>
    `<rect class="${css}" x="${item.bounds.left * 1000}" y="${item.bounds.top * 1000}" width="${(item.bounds.right - item.bounds.left) * 1000}" height="${(item.bounds.bottom - item.bounds.top) * 1000}"/><text x="${item.bounds.left * 1000}" y="${item.bounds.top * 1000 + 15}">${escape(item.id)}</text>`;
  const polygons = regions
    .map(
      (region) =>
        `<polygon points="${region.polygon.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")}"/><text x="${(region.polygon[0]?.x ?? 0) * 1000}" y="${(region.polygon[0]?.y ?? 0) * 1000}">${region.readingOrder}</text>`,
    )
    .join("");
  const image = (overlay) =>
    `<div class="image"><img src="../../../../images/${escape(run.request.sample.file)}" alt="Página original preservada"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none">${overlay}</svg></div>`;
  const suppressionAudit = !layout
    ? ""
    : `<h2>Auditoria de duplicatas</h2><p>Contrato ${escape(layout.layoutVersion)} · candidatos: ${layout.bubbles.length + (layout.suppressedBubbles?.length ?? 0)} · retidos: ${layout.bubbles.length} · suprimidos: ${layout.suppressedBubbles?.length ?? 0}</p>${layout.layoutVersion === "1.0" ? "<p>Análise histórica sem filtragem de duplicatas.</p>" : `<ul>${layout.suppressedBubbles.map((s) => `<li>${escape(s.bubble.id)} → ${escape(s.retainedBubbleId)} · IoU ${escape(s.iou)} · confiança ${escape(s.bubble.confidence)} · ${escape(s.reason)}</li>`).join("")}</ul>${layout.suppressedBubbles.length ? `<details><summary>Ver caixas suprimidas (não usadas na associação)</summary>${image(layout.suppressedBubbles.map((s) => shape(s.bubble, "bubble")).join(""))}</details>` : ""}`}`;
  return `${MARKER}<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Layout experimental</title><style>body{font:16px system-ui;margin:24px;background:#fafafa;color:#222}.banner{position:sticky;top:0;background:#fff1a3;padding:16px;z-index:2}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.image{position:relative}.image img{width:100%;display:block}svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}polygon{stroke:#cf0050;fill:#ff005011;stroke-width:2}rect{fill:none;stroke-width:3}.panel{stroke:#005fcf}.bubble{stroke:#009966}text{font:15px system-ui;fill:#111;stroke:white;stroke-width:.6;paint-order:stroke}pre{white-space:pre-wrap}code{overflow-wrap:anywhere}@media(max-width:700px){.columns{display:block}}</style></head><body><h1 class="banner">layout experimental — não aprovado</h1><p>OCR reproduzido de captura anterior (${escape(run.request.mode)}); inferência local nova de layout. Nenhuma chamada nova ao Vision. Sem tradução, CER ou nota de qualidade.</p><p>Estado: ${escape(result.status)} · ${escape(result.errorCode)} · experimental: ${escape(layout?.state)} · duração: ${escape(result.durationMs)} ms</p><div class="columns"><section><h2>OCR original: ordem preservada</h2>${image(polygons)}</section><section><h2>Quadros e balões detectados</h2>${image(layout ? layout.panels.map((p) => shape(p, "panel")).join("") + layout.bubbles.map((b) => shape(b, "bubble")).join("") : "")}</section></div>${layout ? `<h2>Agrupamentos</h2><ul>${layout.groups.map((group) => `<li>${escape(group.bubbleId)}: regiões ${group.regionIds.map(number).join(", ")}</li>`).join("")}</ul><p>Ordem sugerida (parcial quando houver pendências): ${layout.suggestedOrder.map(number).join(" → ")}</p><p>Não associados a quadro e/ou balão: ${layout.unassociated.map(number).join(", ")}</p><ul>${layout.ambiguities.map((a) => `<li>${escape(a.reason)}: ${a.regionIds.map(number).join(", ")}</li>`).join("")}</ul>` : "<p>Sem saída de layout; não há geometria inventada.</p>"}${suppressionAudit}<h2>Texto por região original</h2><ol start="0">${regions.map((region) => `<li><pre>${escape(region.sourceText)}</pre></li>`).join("")}</ol><h2>Observações manuais</h2><p>Registrar em notes.md; nenhuma aprovação humana presumida. IDs só se referem ao manifesto desta rodada.</p><p>Modelo: ogkalu/comic-text-and-bubble-detector · Apache-2.0 · ${MODEL_SHA}</p><footer>${renderAttribution(run.request.sample, run.request.credits)}</footer></body></html>`;
}

export async function writeLayoutReport(root, runId, analysisId) {
  check(ID.test(runId) && ID.test(analysisId));
  const run = await loadRun(root, runId);
  check(run.result.status === "succeeded" && run.manifest);
  const parent = join(root, "runs", runId, "layouts"),
    path = join(parent, analysisId);
  await directory(parent);
  await directory(path);
  let result;
  try {
    result = JSON.parse(await file(join(path, "result.json"), 65536));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    result = { status: "interrupted" };
  }
  const layout =
    result.status === "succeeded"
      ? validateLayout(
          await file(join(path, "layout.json"), 1048576),
          result,
          run,
        )
      : null;
  const destination = join(path, "report.html");
  try {
    check((await file(destination, 16000000)).toString().startsWith(MARKER));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(destination, renderLayoutReport(run, result, layout), {
    mode: 0o600,
  });
  return destination;
}

export async function runLayout(root, options) {
  const run = await loadRun(root, options["run-id"]);
  check(
    run.result.status === "succeeded" &&
      run.manifest &&
      run.result.rawResponse?.status === "captured",
  );
  const model = resolve(
    options.model ?? join(root, "models/comic-detector-16e8a622/detector.onnx"),
  );
  check(hash(await file(model, 200000000)) === MODEL_SHA);
  const output = await reserveAnalysis(
    root,
    options["run-id"],
    options["analysis-id"],
  );
  const git = (args) =>
    execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  await writeFile(
    join(output, "request.json"),
    JSON.stringify(
      {
        version: 1,
        runId: options["run-id"],
        analysisId: options["analysis-id"],
        direction: options.direction,
        modelSha256: MODEL_SHA,
        imageSha256: run.request.sample.sha256,
        ocrManifestSha256: run.result.manifestSha256,
        startedAt: new Date().toISOString(),
        gitRevision: git(["rev-parse", "HEAD"]),
        gitDirty: git(["status", "--porcelain"]).length > 0,
        nodeVersion: process.version,
        inference: "local-cpu",
        newVisionCalls: 0,
      },
      null,
      2,
    ),
    { flag: "wx", mode: 0o600 },
  );
  await writeFile(
    join(output, "notes.md"),
    "# Layout experimental — não aprovado\n\nSem revisão humana registrada.\n",
    { flag: "wx", mode: 0o600 },
  );
  const passed = await new Promise((done, reject) => {
    const child = spawn(
      join(REPO, "api/mvnw"),
      [
        "-o",
        "-B",
        "-q",
        "-pl",
        "apps/translation-gateway",
        "-am",
        "test",
        "-Dtest=ManualLayoutEvaluationIT",
        "-Dsurefire.failIfNoSpecifiedTests=false",
      ],
      {
        cwd: join(REPO, "api"),
        env: layoutEnvironment(options, model),
        stdio: "ignore",
      },
    );
    child.on("error", reject);
    child.on("exit", (code) => done(code === 0));
  });
  const report = await writeLayoutReport(
    root,
    options["run-id"],
    options["analysis-id"],
  );
  if (!passed)
    throw new Error(
      "Layout interrompido; consulte o relatório. Sem retomada automática.",
    );
  return report;
}
