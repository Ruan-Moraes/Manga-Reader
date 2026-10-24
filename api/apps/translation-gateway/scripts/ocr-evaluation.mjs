import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureSample,
  validateManifest,
  renderAttribution,
  sampleRights,
} from "./ocr-samples.mjs";

const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const ROOT = join(REPO, ".local/ocr-samples");
const CATALOG = new URL("../docs/ocr-evaluation/samples.json", import.meta.url);
const MARKER = "<!doctype html><!-- Toonlira OCR evaluation v1 -->";
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function requireThat(value, message) {
  if (!value) throw new Error(message);
}

export function parseOptions(args) {
  const [command, ...rest] = args;
  requireThat(
    ["run", "report", "layout", "diagnose", "columns"].includes(command),
    "Use run, report, layout, diagnose ou columns.",
  );
  const options = { command, sample: "pt-ep01-p01" };
  const allowed =
    command === "run"
      ? [
          "mode",
          "run-id",
          "sample",
          "project",
          "bucket",
          "confirm-paid-call",
          "credentials-file",
          "service-account",
        ]
      : command === "layout"
        ? ["run-id", "analysis-id", "direction", "model"]
        : command === "diagnose"
          ? ["run-id", "analysis-id"]
          : command === "columns"
            ? ["run-id", "diagnostic", "experiment-id", "profile"]
            : ["run-id", "compare", "layout", "diagnostic", "columns"];
  const seen = new Set();
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].slice(2);
    requireThat(
      rest[i].startsWith("--") && allowed.includes(key) && !seen.has(key),
      "Opção inválida ou repetida.",
    );
    seen.add(key);
    if (key === "confirm-paid-call") options[key] = true;
    else {
      requireThat(
        rest[i + 1] && !rest[i + 1].startsWith("--"),
        "Valor ausente.",
      );
      options[key] = rest[++i];
    }
  }
  requireThat(
    ID.test(options["run-id"] ?? "") &&
      (!options.compare || ID.test(options.compare)),
    "ID de rodada inválido.",
  );
  if (command === "layout")
    requireThat(
      ID.test(options["analysis-id"] ?? "") &&
        ["ltr", "rtl"].includes(options.direction),
      "Layout exige ID de análise e direção ltr ou rtl explícita.",
    );
  if (options.layout)
    requireThat(
      ID.test(options.layout) && !options.compare,
      "ID de layout inválido ou comparação incompatível.",
    );
  if (command === "diagnose")
    requireThat(
      ID.test(options["analysis-id"] ?? ""),
      "Diagnóstico exige ID de análise.",
    );
  if (options.diagnostic)
    requireThat(
      ID.test(options.diagnostic) && !options.compare && !options.layout,
      "Diagnóstico não aceita comparação ou layout.",
    );
  if (command === "columns")
    requireThat(
      ID.test(options["experiment-id"] ?? "") &&
        ID.test(options.diagnostic ?? "") &&
        Boolean(options.profile),
      "Columns exige diagnóstico, experimento e perfil local.",
    );
  if (options.columns)
    requireThat(
      ID.test(options.columns) &&
        !options.compare &&
        !options.layout &&
        !options.diagnostic,
      "Relatório columns incompatível com outras opções.",
    );
  if (command === "run") {
    requireThat(
      ["offline", "vision"].includes(options.mode),
      "Informe --mode offline ou vision.",
    );
    requireThat(ID.test(options.sample), "ID de amostra inválido.");
    if (options.mode === "vision") {
      requireThat(
        options["confirm-paid-call"] &&
          /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(options.project ?? "") &&
          /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(options.bucket ?? ""),
        "Vision exige projeto, bucket de testes privado e --confirm-paid-call.",
      );
      requireThat(
        isAbsolute(options["credentials-file"] ?? "") &&
          /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(
            (options["service-account"] ?? "").split("@")[0],
          ) &&
          options["service-account"].endsWith(
            `@${options.project}.iam.gserviceaccount.com`,
          ),
        "Vision exige --credentials-file absoluto e --service-account no projeto informado.",
      );
    } else
      requireThat(
        !options.project &&
          !options.bucket &&
          !options["confirm-paid-call"] &&
          !options["credentials-file"] &&
          !options["service-account"],
        "Opções cloud não são aceitas em modo offline.",
      );
  }
  return options;
}

async function directory(path) {
  const stat = await lstat(path);
  requireThat(
    stat.isDirectory() && !stat.isSymbolicLink(),
    "Diretório ausente ou simbólico.",
  );
}

async function safeFile(path, limit) {
  const stat = await lstat(path);
  requireThat(
    stat.isFile() && !stat.isSymbolicLink() && stat.size <= limit,
    "Arquivo inválido ou excedente.",
  );
  return readFile(path);
}

export async function reserveRun(root, id) {
  requireThat(ID.test(id), "ID de rodada inválido.");
  await directory(dirname(root));
  await directory(root);
  const runs = join(root, "runs");
  await mkdir(runs, { mode: 0o700 }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
  await directory(runs);
  const path = join(runs, id);
  await mkdir(path, { mode: 0o700 }); // Atomic reservation; no recursive mkdir or automatic resume.
  return path;
}

function validPolygon(points) {
  if (
    !Array.isArray(points) ||
    points.length !== 4 ||
    points.some(
      (p) =>
        !p ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.x > 1 ||
        p.y < 0 ||
        p.y > 1,
    )
  )
    return false;
  const crosses = points.map((p, i) => {
    const b = points[(i + 1) % 4],
      c = points[(i + 2) % 4];
    return (b.x - p.x) * (c.y - b.y) - (b.y - p.y) * (c.x - b.x);
  });
  return crosses.every((n) => n >= 1e-8) || crosses.every((n) => n <= -1e-8);
}

export function validateResult(result, bytes, sample) {
  requireThat(
    result.status === "succeeded" &&
      result.stageStatus === "SUCCEEDED" &&
      result.jobStatus === "TRANSLATING",
    "OCR não concluiu com estado válido.",
  );
  requireThat(
    bytes.length <= 1_048_576 && sha(bytes) === result.manifestSha256,
    "Hash/tamanho do manifesto divergente.",
  );
  const manifest = JSON.parse(bytes);
  requireThat(
    manifest.version === "1.0" &&
      manifest.jobRef === result.jobRef &&
      manifest.sourceLanguage === sample.language &&
      manifest.widthPx === sample.width &&
      manifest.heightPx === sample.height &&
      Array.isArray(manifest.regions) &&
      manifest.regions.length <= 1024,
    "Manifesto incompatível com a amostra.",
  );
  const ids = new Set();
  let total = 0;
  for (const [order, region] of manifest.regions.entries()) {
    requireThat(
      region &&
        /^[0-9a-f-]{36}$/.test(region.id) &&
        !ids.has(region.id) &&
        region.readingOrder === order &&
        typeof region.sourceText === "string" &&
        region.sourceText.trim() &&
        region.sourceText.length <= 4096 &&
        validPolygon(region.polygon),
      "Região inválida.",
    );
    ids.add(region.id);
    total += region.sourceText.length;
  }
  requireThat(total <= 262144, "Texto excedente.");
  return manifest;
}

export function validateRawResponse(capture, bytes, mode) {
  requireThat(
    capture?.status === "captured" &&
      capture.format ===
        "google.cloud.vision.v1.BatchAnnotateImagesResponse/protobuf" &&
      capture.synthetic === (mode === "offline") &&
      bytes.length <= 4_194_304 &&
      bytes.length === capture.bytes &&
      sha(bytes) === capture.sha256,
    "Resposta bruta ausente ou com integridade/proveniência inválida.",
  );
}

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderReport(runs) {
  requireThat(
    runs.length > 0 && runs.length <= 2,
    "Selecione uma ou duas rodadas.",
  );
  const first = runs[0].request.sample;
  requireThat(
    runs.every(
      (r) =>
        r.request.sample.id === first.id &&
        r.request.sample.sha256 === first.sha256,
    ),
    "Compare somente a mesma amostra e hash.",
  );
  const columns = runs
    .map(({ request, result, manifest }) => {
      const regions = manifest?.regions ?? [];
      const modeLabel =
        request.mode === "offline"
          ? "SIMULAÇÃO — não reconheceu o texto da imagem"
          : manifest
            ? "Cloud Vision — saída observada, sem aprovação de qualidade"
            : "Cloud Vision — sem saída confirmada; consulte o estado da execução";
      const polygons = regions
        .map(
          (r) =>
            `<polygon points="${r.polygon.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")}"/><text x="${r.polygon[0].x * 1000}" y="${r.polygon[0].y * 1000}">${r.readingOrder}</text>`,
        )
        .join("");
      return `<section><h2>${escape(request.runId)}</h2><p class="mode">${modeLabel}</p>
<p>Estado: ${escape(result.status)} · job: ${escape(result.jobStatus)} · OCR: ${escape(result.stageStatus)} ${escape(result.errorCode)}</p><p>Limpeza pendente: ${escape(result.cleanupPending ?? "desconhecida")}${result.failurePhase ? ` · fase da falha: ${escape(result.failurePhase)}` : ""}</p>
<div class="image"><img src="../../images/${escape(request.sample.file)}" alt="Página original em ${escape(request.sample.language)}"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Regiões OCR numeradas">${polygons}</svg></div>
<ol start="0">${regions.map((r) => `<li><pre>${escape(r.sourceText)}</pre></li>`).join("")}</ol>
<p>SHA-256 da imagem: <code>${escape(request.sample.sha256)}</code></p><p>SHA-256 do manifesto: <code>${escape(result.manifestSha256)}</code></p>
<p>Captura bruta: ${escape(result.rawResponse?.status ?? "não registrada (rodada antiga)")} · SHA-256: <code>${escape(result.rawResponse?.sha256)}</code> · quota: ${escape(result.quotaProject ?? "não registrada")}</p>
<p>Início: ${escape(request.startedAt)} · fim: ${escape(result.finishedAt)} · revisão: ${escape(request.gitRevision)} · alterações locais: ${escape(request.gitDirty)}</p><p>Node: ${escape(request.nodeVersion)} · Java: ${escape(result.javaVersion)} · Vision SDK: ${escape(result.visionVersion)} · dependências: ${escape(request.dependenciesSha256)}</p>
<h3>Observações manuais</h3><p>Edite <code>notes.md</code> na pasta da rodada. O relatório não salva anotações digitadas no navegador.</p></section>`;
    })
    .join("");
  return `${MARKER}<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Avaliação manual OCR</title><style>body{font:16px system-ui;margin:2rem;color:#202020;background:#fafafa}.columns{display:grid;grid-template-columns:repeat(${runs.length},minmax(0,1fr));gap:2rem}.image{position:relative}.image img{display:block;width:100%}svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}polygon{fill:#ffff0022;stroke:#e40046;stroke-width:2}text{fill:#000;stroke:#fff;stroke-width:.7;font-size:18px;paint-order:stroke}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}.mode{background:#fff0b3;padding:1rem}@media(max-width:700px){.columns{display:block}}</style></head><body><h1>Avaliação manual OCR</h1><p>Sem tradução, CER ou nota de qualidade. A ordem é a do provider; IDs não alinham regiões entre rodadas.</p><div class="columns">${columns}</div><footer><p>${renderAttribution(first, runs[0].request.credits)}</p><p>Relatório derivado de avaliação. Links externos só acessam a rede quando clicados.</p></footer></body></html>`;
}

export async function loadRun(root, id) {
  requireThat(ID.test(id), "ID de rodada inválido.");
  await directory(dirname(root));
  await directory(root);
  await directory(join(root, "runs"));
  const path = join(root, "runs", id);
  await directory(path);
  const request = JSON.parse(await safeFile(join(path, "request.json"), 65536));
  const catalog = JSON.parse(await readFile(CATALOG));
  validateManifest(catalog);
  const sample = catalog.samples.find((s) => s.id === request.sample?.id);
  requireThat(
    sample &&
      JSON.stringify(sample) === JSON.stringify(request.sample) &&
      ["offline", "vision"].includes(request.mode) &&
      request.runId === id,
    "Metadados da rodada divergentes.",
  );
  await ensureSample(root, sample);
  let result;
  try {
    result = JSON.parse(await safeFile(join(path, "result.json"), 65536));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    result = { status: "interrupted", errorCode: "evaluation-interrupted" };
  }
  let manifest = null;
  try {
    if (
      request.version >= 2 &&
      (result.status === "succeeded" ||
        result.rawResponse?.status === "captured")
    ) {
      validateRawResponse(
        result.rawResponse,
        await safeFile(join(path, "vision-response.pb"), 4_194_304),
        request.mode,
      );
    }
    if (result.status === "succeeded")
      manifest = validateResult(
        result,
        await safeFile(join(path, "manifest.json"), 1048576),
        sample,
      );
  } catch {
    result = {
      ...result,
      status: "failed",
      errorCode: "evaluation-invalid-artifact",
    };
  }
  return { request, result, manifest };
}

async function writeReport(root, id, compare) {
  const runs = await Promise.all(
    [id, ...(compare ? [compare] : [])].map((name) => loadRun(root, name)),
  );
  const path = join(
    root,
    "runs",
    id,
    compare ? `compare-${compare}.html` : "report.html",
  );
  try {
    const old = await safeFile(path, 16000000);
    requireThat(
      old.toString().startsWith(MARKER),
      "Relatório externo preservado.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(path, renderReport(runs), { mode: 0o600 });
  return path;
}

export function harnessEnvironment(options, parent = process.env) {
  // Do not echo Maven output: a framework exception may contain an object key or credentials.
  const inherited = Object.fromEntries(
    Object.entries(parent).filter(
      ([key]) =>
        !/^(SPRING_|GATEWAY_|LOGGING_|OCR_EVAL_|GOOGLE_|GCLOUD_|CLOUDSDK_|JAVA_TOOL_OPTIONS$|JDK_JAVA_OPTIONS$|_JAVA_OPTIONS$|MAVEN_OPTS$|MAVEN_ARGS$)/.test(
          key,
        ),
    ),
  );
  return {
    ...inherited,
    OCR_EVAL_RUN_ID: options["run-id"],
    OCR_EVAL_PROJECT: options.project ?? "",
    OCR_EVAL_BUCKET: options.bucket ?? "",
    OCR_EVAL_CONFIRM_PAID_CALL: options["confirm-paid-call"] ? "yes" : "no",
    OCR_EVAL_CREDENTIALS_FILE: options["credentials-file"] ?? "",
    OCR_EVAL_SERVICE_ACCOUNT: options["service-account"] ?? "",
  };
}

async function executeHarness(options) {
  const env = harnessEnvironment(options);
  return new Promise((done, reject) => {
    const child = spawn(
      join(REPO, "api/mvnw"),
      [
        ...(options.mode === "offline" ? ["-o"] : []),
        "-B",
        "-q",
        "-pl",
        "apps/translation-gateway",
        "-am",
        "test",
        "-Dtest=ManualOcrEvaluationIT",
        "-Dsurefire.failIfNoSpecifiedTests=false",
      ],
      { cwd: join(REPO, "api"), env, stdio: "ignore" },
    );
    child.on("error", () =>
      reject(new Error("Não foi possível iniciar o harness Maven.")),
    );
    child.on("exit", (code) => done(code === 0));
  });
}

export async function main(args) {
  const options = parseOptions(args);
  if (options.command === "columns" || options.columns) {
    const columns = await import("./ocr-columns.mjs");
    return options.command === "columns"
      ? columns.runColumns(ROOT, options)
      : columns.writeColumnsReport(ROOT, options["run-id"], options.columns);
  }
  if (options.command === "diagnose" || options.diagnostic) {
    const diagnostic = await import("./ocr-diagnostic.mjs");
    return options.command === "diagnose"
      ? diagnostic.runDiagnostic(ROOT, options)
      : diagnostic.writeDiagnosticReport(
          ROOT,
          options["run-id"],
          options.diagnostic,
        );
  }
  if (options.command === "layout" || options.layout) {
    const layout = await import("./ocr-layout.mjs");
    return options.command === "layout"
      ? layout.runLayout(ROOT, options)
      : layout.writeLayoutReport(ROOT, options["run-id"], options.layout);
  }
  if (options.command === "report")
    return writeReport(ROOT, options["run-id"], options.compare);
  const catalog = JSON.parse(await readFile(CATALOG));
  validateManifest(catalog);
  const sample = catalog.samples.find((s) => s.id === options.sample);
  requireThat(sample, "Amostra desconhecida.");
  await ensureSample(ROOT, sample);
  const path = await reserveRun(ROOT, options["run-id"]);
  const git = (args) =>
    execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  const dependencyFiles = await Promise.all(
    [
      join(REPO, "api/pom.xml"),
      join(REPO, "api/apps/translation-gateway/pom.xml"),
    ].map((file) => readFile(file)),
  );
  const request = {
    version: 2,
    runId: options["run-id"],
    sample,
    mode: options.mode,
    credits: sampleRights(sample, catalog.credits).credits,
    startedAt: new Date().toISOString(),
    gitRevision: git(["rev-parse", "HEAD"]),
    gitDirty: git(["status", "--porcelain"]).length > 0,
    nodeVersion: process.version,
    dependenciesSha256: sha(Buffer.concat(dependencyFiles)),
  };
  await writeFile(
    join(path, "request.json"),
    JSON.stringify(request, null, 2) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  await writeFile(
    join(path, "notes.md"),
    "# Observações manuais\n\nSem revisão registrada. Anotar omissões, texto, geometria e ordem; não confundir simulação com OCR real.\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Rodada reservada. Executando harness isolado; nenhuma saída bruta será exibida.",
  );
  const passed = await executeHarness(options);
  const report = await writeReport(ROOT, options["run-id"]);
  const run = await loadRun(ROOT, options["run-id"]);
  if (!passed || run.result.status !== "succeeded") {
    console.log(report);
    throw new Error(
      "Rodada falhou ou foi interrompida. Consulte o relatório; não há retomada automática.",
    );
  }
  return report;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2))
    .then((path) => console.log(path))
    .catch(() => {
      console.error(
        "Avaliação não concluída. Confira argumentos, pré-requisitos e o relatório local; não há repetição automática.",
      );
      process.exitCode = 1;
    });
}
