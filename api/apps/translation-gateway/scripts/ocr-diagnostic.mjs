import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { lstat, mkdir, readFile, writeFile, open } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRun, validateRawResponse } from "./ocr-evaluation.mjs";
import { renderAttribution } from "./ocr-samples.mjs";

const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const MODULE = join(REPO, "api/apps/translation-gateway");
const HELPER = join(
  MODULE,
  "src/test/java/com/toonlira/translationgateway/evaluation/VisionDiagnostic.java",
);
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_JSON = 16 * 1024 * 1024;
const MAX_HTML = 64 * 1024 * 1024;
const MARKER = "<!doctype html><!-- Toonlira offline diagnostic v1 -->";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (value) => {
  if (!value) throw new Error("diagnostic-invalid-artifact");
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
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    check(stat.isFile() && stat.size <= max);
    const bytes = await handle.readFile();
    check(bytes.length <= max);
    return bytes;
  } finally {
    await handle.close();
  }
}
export { file as readDiagnosticFile };
async function analysisPath(root, runId, analysisId, reserve = false) {
  check(ID.test(runId) && ID.test(analysisId));
  const run = join(root, "runs", runId);
  for (const path of [dirname(root), root, join(root, "runs"), run])
    await directory(path);
  const parent = join(run, "diagnostics");
  if (reserve)
    await mkdir(parent, { mode: 0o700 }).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
  await directory(parent);
  const path = join(parent, analysisId);
  if (reserve) await mkdir(path, { mode: 0o700 });
  await directory(path);
  return path;
}
export const reserveDiagnostic = (root, runId, analysisId) =>
  analysisPath(root, runId, analysisId, true);

export function diagnosticEnvironment(parent = process.env) {
  return Object.fromEntries(
    ["PATH", "JAVA_HOME", "LANG", "LC_ALL", "TMPDIR"]
      .filter((key) => parent[key] !== undefined)
      .map((key) => [key, parent[key]]),
  );
}

async function verifiedRun(root, id) {
  const run = await loadRun(root, id);
  check(
    run.result.status === "succeeded" &&
      run.manifest &&
      run.result.rawResponse?.status === "captured",
  );
  const raw = await file(
    join(root, "runs", id, "vision-response.pb"),
    4_194_304,
  );
  validateRawResponse(run.result.rawResponse, raw, run.request.mode);
  return run;
}

export function validateDiagnostic(diagnostic, run) {
  check(
    diagnostic?.diagnosticVersion === "1.0" &&
      diagnostic.parserRevision === "vision-structure-1" &&
      diagnostic.mapperReplayExactlyMatches === true,
  );
  check(
    diagnostic.widthPx === run.request.sample.width &&
      diagnostic.heightPx === run.request.sample.height,
  );
  check(Array.isArray(diagnostic.nodes) && diagnostic.nodes.length <= 100_000);
  const paths = new Set(),
    regions = new Set();
  for (const node of diagnostic.nodes) {
    check(
      node &&
        /^(0|[1-9]\d*)(\/(0|[1-9]\d*)){0,4}$/.test(node.path) &&
        !paths.has(node.path),
    );
    paths.add(node.path);
    check(
      ["page", "block", "paragraph", "word", "symbol"][
        node.path.split("/").length - 1
      ] === node.kind,
    );
    check(node.parent === node.path.split("/").slice(0, -1).join("/"));
    check(
      node.text === null ||
        (typeof node.text === "string" && node.text.length <= 262144),
    );
    check(
      node.confidence === null ||
        (Number.isFinite(node.confidence) &&
          node.confidence >= 0 &&
          node.confidence <= 1),
    );
    check(
      node.detectedBreak === null ||
        (typeof node.detectedBreak.type === "string" &&
          typeof node.detectedBreak.isPrefix === "boolean"),
    );
    for (const key of ["vertices", "normalizedVertices"]) {
      check(Array.isArray(node[key]));
      for (const point of node[key])
        check(point && Number.isFinite(point.x) && Number.isFinite(point.y));
    }
    check(
      ["valid", "invalid", "missing"].includes(node.geometry) &&
        ["wide", "tall", "square", "unknown"].includes(node.aspectHint),
    );
    if (node.geometry === "valid")
      check(
        node.vertices.length === 4 &&
          node.normalizedVertices.length === 0 &&
          node.vertices.every(
            (p) =>
              p.x >= 0 &&
              p.y >= 0 &&
              p.x <= diagnostic.widthPx &&
              p.y <= diagnostic.heightPx,
          ),
      );
    if (node.kind === "paragraph") {
      check(
        ["retained", "blank", "invalid-geometry", "duplicate"].includes(
          node.disposition,
        ),
      );
      if (node.disposition === "retained") {
        const region = run.manifest.regions.find((r) => r.id === node.regionId);
        check(
          region &&
            region.readingOrder === node.readingOrder &&
            !regions.has(node.regionId),
        );
        regions.add(node.regionId);
      } else check(node.regionId === null && node.readingOrder === null);
    }
  }
  check(regions.size === run.manifest.regions.length);
  return diagnostic;
}

export function renderDiagnostic(
  run,
  diagnostic,
  notes = "Revisão ainda não registrada.",
) {
  validateDiagnostic(diagnostic, run);
  const { nodes, widthPx: width, heightPx: height } = diagnostic;
  const confidence = (n) =>
    n.confidence === null
      ? "não informada (zero proto3 não distingue ausência)"
      : escape(n.confidence);
  const polygon = (n) =>
    n.geometry !== "valid"
      ? ""
      : `<polygon class="${n.kind}" points="${n.vertices.map((v) => `${v.x},${v.y}`).join(" ")}"><title>${escape(n.path)} · ${escape(n.text)}</title></polygon>`;
  const image = (items, viewBox = `0 0 ${width} ${height}`) =>
    `<svg class="page" viewBox="${viewBox}" role="img" aria-label="Imagem original com coordenadas da captura"><image width="${width}" height="${height}" href="../../../../images/${escape(run.request.sample.file)}"/>${items.map(polygon).join("")}</svg>`;
  const paragraphs = nodes.filter((n) => n.kind === "paragraph");
  const details = paragraphs
    .map((paragraph) => {
      const children = nodes.filter((n) =>
        n.path.startsWith(paragraph.path + "/"),
      );
      const items = [paragraph, ...children];
      const validPoints = items
        .filter((n) => n.geometry === "valid")
        .flatMap((n) => n.vertices);
      let viewBox;
      if (validPoints.length) {
        const left = Math.max(0, Math.min(...validPoints.map((v) => v.x)) - 15),
          top = Math.max(0, Math.min(...validPoints.map((v) => v.y)) - 15);
        const right = Math.min(
            width,
            Math.max(...validPoints.map((v) => v.x)) + 15,
          ),
          bottom = Math.min(
            height,
            Math.max(...validPoints.map((v) => v.y)) + 15,
          );
        viewBox = `${left} ${top} ${right - left} ${bottom - top}`;
      }
      const region = run.manifest.regions.find(
        (r) => r.id === paragraph.regionId,
      );
      return `<details id="p-${paragraph.path.replaceAll("/", "-")}"><summary>Região ${paragraph.readingOrder ?? "descartada"} · posição ${paragraph.path} · ${paragraph.disposition} · geometria ${paragraph.geometry} / ${paragraph.aspectHint}</summary>
<p>ID: ${escape(paragraph.regionId ?? "sem associação")} · Confiança: ${confidence(paragraph)}</p>
<p>Texto do manifesto (sem alteração):</p><pre>${escape(region?.sourceText ?? "Parágrafo não retido pelo mapper")}</pre>
<label><input class="words-toggle" type="checkbox" checked> Palavras (azul)</label><label><input class="symbols-toggle" type="checkbox" checked> Símbolos (verde)</label>
${image(items, viewBox)}<h3>Sequência original de palavras e símbolos</h3><p>Índices são estruturais. Quebras declaradas estão separadas, sem espaços ou ordem inventados.</p>
<table><thead><tr><th>Posição / tipo</th><th>Texto</th><th>Geometria em pixels</th><th>Confiança</th><th>Quebra</th></tr></thead><tbody>${children.map((n) => `<tr><td>${n.path} · ${n.kind}</td><td><pre>${escape(n.text)}</pre></td><td>${escape(n.geometry)} / ${escape(n.aspectHint)}<br>${escape(JSON.stringify(n.vertices))}</td><td>${confidence(n)}</td><td>${escape(JSON.stringify(n.detectedBreak))}</td></tr>`).join("")}</tbody></table></details>`;
    })
    .join("");
  const counts = ["page", "block", "paragraph", "word", "symbol"]
    .map((kind) => `${kind}: ${nodes.filter((n) => n.kind === kind).length}`)
    .join(" · ");
  const html = `${MARKER}<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Diagnóstico offline OCR</title><style>body{font:16px system-ui;margin:1rem auto;max-width:1500px;padding:1rem}svg.page{display:block;width:100%;max-height:90vh;background:#eee}polygon{fill:none;stroke-width:1;vector-effect:non-scaling-stroke}.paragraph{stroke:#c00032}.word{stroke:#0066e5}.symbol{stroke:#008020}details{margin:1rem 0;padding:1rem;border:1px solid #777}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:.85rem}td,th{border:1px solid #aaa;padding:.4rem;overflow-wrap:anywhere}details:has(.words-toggle:not(:checked)) .word,details:has(.symbols-toggle:not(:checked)) .symbol{display:none}label{margin-right:1rem}.warning{background:#fff1b0;padding:1rem}code{overflow-wrap:anywhere}</style></head><body>
<h1>Diagnóstico offline da captura OCR</h1><p class="warning">${run.request.mode === "offline" ? "SIMULAÇÃO — não reconheceu o texto da imagem" : "OCR real reproduzido de captura anterior — nenhuma nova chamada"}. Sem aprovação de qualidade ou revisão humana independente.</p>
<p>${escape(run.request.runId)} · ${counts} · replay exato do mapper confirmado.</p>
<p>Vermelho: parágrafos; azul: palavras; verde: símbolos. Caixas largas/altas são indícios geométricos, não direção de leitura confirmada. Geometria inválida/ausente permanece na tabela, sem caixa inventada.</p>
${image(paragraphs)}<h2>Inspeção por região</h2>${details}<h2>Candidatos visuais e revisão humana</h2><p>Reorganização não executada. Registre hipóteses e observações em notes.md; este HTML não salva edições. Separar reconhecimento, segmentação, ordem e revisão humana. Não há CER nem nota de qualidade.</p>
<h2>Observações registradas separadamente</h2><pre>${escape(notes)}</pre><footer>${renderAttribution(run.request.sample, run.request.credits)}<p>Links externos só acessam a rede quando clicados. Artefatos privados; não publicar transcrições.</p></footer></body></html>`;
  check(Buffer.byteLength(html) <= MAX_HTML);
  return html;
}

async function localClasspath() {
  const xml = (
    await file(
      join(
        MODULE,
        "target/surefire-reports/TEST-com.toonlira.translationgateway.evaluation.VisionDiagnosticTest.xml",
      ),
      MAX_JSON,
    )
  ).toString();
  const match = xml.match(/<property name="java.class.path" value="([^"]+)"/);
  check(match);
  const cp = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .split(delimiter)
    .filter(Boolean)
    .join(delimiter);
  for (const path of cp.split(delimiter)) {
    check(path.startsWith("/") && !path.includes("*"));
    const stat = await lstat(path);
    check(stat.isDirectory() || stat.isFile());
  }
  return cp;
}

async function executeParser(runDir, output, run, classpath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "java",
      [
        "-Xmx256m",
        "--class-path",
        classpath,
        HELPER,
        runDir,
        output,
        run.result.rawResponse.sha256,
        run.result.manifestSha256,
      ],
      { env: diagnosticEnvironment(), stdio: "ignore" },
    );
    const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("diagnostic-parser-unavailable"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error("diagnostic-parser-failed"));
    });
  });
}
const writeNew = (path, value) =>
  writeFile(path, value, { flag: "wx", mode: 0o600 });

export async function runDiagnostic(root, options) {
  const runId = options["run-id"],
    analysisId = options["analysis-id"];
  const run = await verifiedRun(root, runId);
  const classpath = await localClasspath(); // No Maven/download implicit in a diagnostic command.
  const path = await reserveDiagnostic(root, runId, analysisId);
  const metadata = {
    diagnosticVersion: "1.0",
    parserRevision: "vision-structure-1",
    runId,
    analysisId,
    startedAt: new Date().toISOString(),
    sampleId: run.request.sample.id,
    imageSha256: run.request.sample.sha256,
    manifestSha256: run.result.manifestSha256,
    rawResponseSha256: run.result.rawResponse.sha256,
    synthetic: run.request.mode === "offline",
    nodeVersion: process.version,
    parserSourceSha256: sha(await file(HELPER, MAX_JSON)),
    mapperClassSha256: sha(
      await file(
        join(
          MODULE,
          "target/classes/com/toonlira/translationgateway/infrastructure/ocr/VisionResponseMapper.class",
        ),
        MAX_JSON,
      ),
    ),
    classpathSha256: sha(classpath),
    providerCalls: 0,
    credentialReads: 0,
    gitRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: REPO,
      encoding: "utf8",
    }).trim(),
    gitDirty:
      execFileSync("git", ["status", "--porcelain"], {
        cwd: REPO,
        encoding: "utf8",
      }).trim().length > 0,
  };
  await writeNew(
    join(path, "request.json"),
    JSON.stringify(metadata, null, 2) + "\n",
  );
  try {
    await executeParser(
      join(root, "runs", runId),
      join(path, "diagnostic.json"),
      run,
      classpath,
    );
    const bytes = await file(join(path, "diagnostic.json"), MAX_JSON);
    validateDiagnostic(JSON.parse(bytes), run);
    // Recheck source integrity after the parser, before reporting success.
    await verifiedRun(root, runId);
    await writeNew(
      join(path, "result.json"),
      JSON.stringify(
        {
          status: "succeeded",
          diagnosticSha256: sha(bytes),
          finishedAt: new Date().toISOString(),
        },
        null,
        2,
      ) + "\n",
    );
    await writeNew(
      join(path, "notes.md"),
      "# Revisão diagnóstica\n\n- Reconhecimento: pendente.\n- Segmentação: pendente.\n- Ordem: pendente.\n- Revisão humana: pendente.\n- Reorganização: não executada; viabilidade inconclusiva.\n",
    );
    return await writeDiagnosticReport(root, runId, analysisId);
  } catch {
    await writeNew(
      join(path, "failure.json"),
      JSON.stringify({
        status: "failed",
        errorCode: "diagnostic-failed",
        finishedAt: new Date().toISOString(),
      }) + "\n",
    );
    throw new Error(
      "diagnostic-failed; reserve outro ID após investigar, sem retomada automática",
    );
  }
}

export async function loadSavedDiagnostic(root, runId, analysisId) {
  const run = await verifiedRun(root, runId);
  const path = await analysisPath(root, runId, analysisId);
  const metadata = JSON.parse(await file(join(path, "request.json"), 65536));
  const result = JSON.parse(await file(join(path, "result.json"), 65536));
  const bytes = await file(join(path, "diagnostic.json"), MAX_JSON);
  const diagnostic = validateSavedDiagnostic(
    bytes,
    metadata,
    result,
    run,
    runId,
    analysisId,
  );
  return { run, path, metadata, result, diagnostic };
}

export async function writeDiagnosticReport(root, runId, analysisId) {
  const { run, path, diagnostic } = await loadSavedDiagnostic(
    root,
    runId,
    analysisId,
  );
  const notes = await file(join(path, "notes.md"), 65536);
  const html = renderDiagnostic(run, diagnostic, notes.toString());
  const output = join(path, "report.html");
  try {
    const old = await file(output, MAX_HTML);
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

export function validateSavedDiagnostic(
  bytes,
  metadata,
  result,
  run,
  runId,
  analysisId,
) {
  check(
    bytes.length <= MAX_JSON &&
      metadata.diagnosticVersion === "1.0" &&
      metadata.parserRevision === "vision-structure-1",
  );
  check(
    metadata.runId === runId &&
      metadata.analysisId === analysisId &&
      metadata.sampleId === run.request.sample.id &&
      metadata.imageSha256 === run.request.sample.sha256 &&
      metadata.manifestSha256 === run.result.manifestSha256 &&
      metadata.rawResponseSha256 === run.result.rawResponse.sha256 &&
      metadata.synthetic === (run.request.mode === "offline"),
  );
  check(
    result.status === "succeeded" && result.diagnosticSha256 === sha(bytes),
  );
  return validateDiagnostic(JSON.parse(bytes), run);
}
