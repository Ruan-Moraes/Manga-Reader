import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import {
  compareSymbols,
  verifyBundle,
  readBounded,
  reserve,
} from "./ocr-calibration.mjs";
import {
  parseOptions,
  harnessEnvironment,
  validateResult,
  validateRawResponse,
} from "./ocr-evaluation.mjs";

const SCRIPT = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(SCRIPT), "../../../..");
const ROOT = path.join(REPO, ".local/ocr-samples/calibration");
const MAX_JSON = 1024 * 1024;
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MARKER = "<!doctype html><!-- Toonlira calibration evaluation v1 -->";
const check = (value) => {
  if (!value) throw Error("calibration-evaluation-invalid");
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
const json = (file) => JSON.parse(readBounded(file, MAX_JSON));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const writeNew = (file, value) =>
  fs.writeFileSync(
    file,
    Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + "\n",
    { flag: "wx", mode: 0o600 },
  );

export function parseCalibrationOptions(args) {
  const [command, ...rest] = args;
  check(["run", "report"].includes(command));
  const special = {},
    forward = [],
    seen = new Set();
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    check(key.startsWith("--") && !seen.has(key));
    seen.add(key);
    if (["--calibration", "--orientation"].includes(key)) {
      check(rest[i + 1] && !rest[i + 1].startsWith("--"));
      special[key.slice(2)] = rest[++i];
    } else {
      check(
        key !== "--sample" &&
          key !== "--compare" &&
          key !== "--layout" &&
          key !== "--diagnostic" &&
          key !== "--columns",
      );
      forward.push(key);
      if (key !== "--confirm-paid-call") forward.push(rest[++i]);
    }
  }
  check(ID.test(special.calibration ?? ""));
  check(
    command === "run"
      ? ["horizontal", "vertical"].includes(special.orientation)
      : special.orientation === undefined,
  );
  return { ...parseOptions([command, ...forward]), ...special };
}

export function compareCaptured(reference, diagnostic, mode) {
  check(
    ["offline", "vision"].includes(mode) &&
      diagnostic?.diagnosticVersion === "1.0" &&
      diagnostic.parserRevision === "vision-structure-1" &&
      diagnostic.mapperReplayExactlyMatches === true,
  );
  check(
    diagnostic.widthPx === reference.widthPx &&
      diagnostic.heightPx === reference.heightPx &&
      Array.isArray(diagnostic.nodes) &&
      diagnostic.nodes.length <= 100000,
  );
  const pages = diagnostic.nodes.filter((n) => n.kind === "page");
  check(pages.length === 1 && pages[0].path === "0");
  const paths = new Set(),
    symbols = [];
  for (const node of diagnostic.nodes) {
    check(node && typeof node.path === "string" && !paths.has(node.path));
    paths.add(node.path);
    if (node.kind !== "symbol") continue;
    check(
      /^0\/(0|[1-9]\d*)\/(0|[1-9]\d*)\/(0|[1-9]\d*)\/(0|[1-9]\d*)$/.test(
        node.path,
      ),
    );
    check(
      typeof node.text === "string" &&
        [...node.text].length <= 64 &&
        Array.isArray(node.vertices) &&
        Array.isArray(node.normalizedVertices),
    );
    const rawBreak = node.detectedBreak;
    check(
      rawBreak === null ||
        (rawBreak &&
          [
            "UNKNOWN",
            "SPACE",
            "SURE_SPACE",
            "EOL_SURE_SPACE",
            "HYPHEN",
            "LINE_BREAK",
            "UNRECOGNIZED",
          ].includes(rawBreak.type) &&
          typeof rawBreak.isPrefix === "boolean"),
    );
    symbols.push({
      path: node.path,
      text: node.text,
      polygonPx: node.normalizedVertices.length
        ? null
        : node.vertices.map((p) => [p.x, p.y]),
      detectedBreak: rawBreak,
      breakAfter: rawBreak
        ? rawBreak.isPrefix
          ? `PREFIX:${rawBreak.type}`
          : rawBreak.type
        : null,
    });
  }
  const measurements = compareSymbols(reference, symbols);
  return {
    ...measurements,
    imageOrigin: "synthetic-control",
    responseOrigin: mode === "offline" ? "simulated" : "vision-capture",
    providerExecuted: mode === "vision",
    evidence:
      mode === "offline"
        ? "synthetic-pipeline-test-only"
        : "captured-control-observation",
    symbols,
  };
}

function bundleInput(root, id, orientation) {
  check(ID.test(id) && ["horizontal", "vertical"].includes(orientation));
  const bundle = path.join(root, id),
    manifest = verifyBundle(bundle);
  check(manifest.id === id);
  const referenceBytes = readBounded(
      path.join(bundle, `${orientation}-reference.json`),
      MAX_JSON,
    ),
    reference = JSON.parse(referenceBytes);
  const image = readBounded(
    path.join(bundle, `${orientation}.png`),
    12 * MAX_JSON,
  );
  return {
    bundle,
    reference,
    sample: {
      id: `${id}-${orientation}`,
      language: "ja",
      mime: "image/png",
      sha256: hash(image),
      bytes: image.length,
      width: 1200,
      height: 1200,
    },
    source: {
      bundleManifestSha256: hash(
        readBounded(path.join(bundle, "manifest.json"), MAX_JSON),
      ),
      referenceSha256: hash(referenceBytes),
      imageSha256: hash(image),
    },
  };
}
function runPath(root, id, runId) {
  check(ID.test(id) && ID.test(runId));
  const directory = path.join(root, id, "runs", runId);
  for (
    let current = path.resolve(directory);
    current !== path.dirname(current);
    current = path.dirname(current)
  ) {
    const stat = fs.lstatSync(current);
    check(stat.isDirectory() && !stat.isSymbolicLink());
  }
  return directory;
}

export function loadCalibrationRun(root, id, runId) {
  const directory = runPath(root, id, runId),
    requestBytes = readBounded(path.join(directory, "request.json"), 65536),
    request = JSON.parse(requestBytes);
  check(
    request.version === "calibration-evaluation/1" &&
      request.calibrationId === id &&
      request.runId === runId &&
      ["offline", "vision"].includes(request.mode),
  );
  const input = bundleInput(root, id, request.orientation);
  check(
    equal(input.source, request.source) && equal(input.sample, request.sample),
  );
  let result;
  try {
    result = json(path.join(directory, "result.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    result = { status: "interrupted", errorCode: "evaluation-interrupted" };
  }
  let comparison = null,
    manifest = null;
  try {
    if (result.status !== "interrupted")
      check(
        result.requestSha256 === hash(requestBytes) &&
          result.referenceSha256 === input.source.referenceSha256,
      );
    if (result.status === "succeeded") {
      validateRawResponse(
        result.rawResponse,
        readBounded(path.join(directory, "vision-response.pb"), 4 * MAX_JSON),
        request.mode,
      );
      manifest = validateResult(
        result,
        readBounded(path.join(directory, "manifest.json"), MAX_JSON),
        input.sample,
      );
      const diagnosticBytes = readBounded(
        path.join(directory, "diagnostic.json"),
        16 * MAX_JSON,
      );
      check(hash(diagnosticBytes) === result.diagnosticSha256);
      comparison = compareCaptured(
        input.reference,
        JSON.parse(diagnosticBytes),
        request.mode,
      );
    }
  } catch {
    result = {
      ...result,
      status: "failed",
      errorCode: "calibration-capture-invalid",
    };
    comparison = null;
    manifest = null;
  }
  return {
    directory,
    request,
    result,
    comparison,
    manifest,
    reference: input.reference,
  };
}

export function renderComparison(run) {
  const { request, result, comparison, reference } = run;
  const banner =
    request.mode === "offline"
      ? "SIMULAÇÃO — não reconheceu o texto da imagem"
      : result.status === "succeeded"
        ? "CAPTURA VISION — imagem de controle sintética, não mangá real"
        : "Modo Vision — sem captura validada para comparação; imagem sintética";
  const overlays = (tokens, field) =>
    tokens
      .filter(
        (t) =>
          Array.isArray(t[field]) &&
          t[field].length === 4 &&
          t[field].flat().every(Number.isFinite),
      )
      .map(
        (t, i) =>
          `<polygon points="${t[field].map((p) => p.join(",")).join(" ")}"/><text x="${t[field][0][0]}" y="${t[field][0][1] - 5}">${i}</text>`,
      )
      .join("");
  const panel = (title, overlay) =>
    `<section><h2>${title}</h2><div class="image"><img src="../../${request.orientation}.png" alt="Controle sintético"><svg viewBox="0 0 1200 1200">${overlay}</svg></div></section>`;
  const metrics = comparison
    ? Object.fromEntries(
        Object.entries(comparison).filter(([key]) => key !== "symbols"),
      )
    : null;
  return `${MARKER}<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Comparação de controle OCR</title><style>body{font:16px system-ui;max-width:1400px;margin:auto;padding:1rem}.warning{background:#fff0b3;padding:1rem}.columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.image{position:relative}img{width:100%;display:block}svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}polygon{fill:none;stroke:#b00040;stroke-width:2}text{fill:#b00040;font-size:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:700px){.columns{display:block}}</style></head><body><h1>Controle ${escape(request.orientation)}</h1><p class="warning">${banner}</p><p>Estado da execução: ${escape(result.status)}. ${escape(result.errorCode)}</p><p>Sem tradução, CER, nota geral ou aprovação linguística. IoU insuficiente não prova erro textual. Quebras do provider preservadas, inclusive prefixos; não há correção de ordem.</p><div class="columns">${panel("Referência conhecida", overlays(reference.tokens, "inkPolygonPx"))}${panel("Observação na ordem recebida", comparison ? overlays(comparison.symbols, "polygonPx") : "")}</div><h2>Comparação</h2><pre>${escape(metrics ? JSON.stringify(metrics, null, 2) : "Sem captura válida para comparação.")}</pre><h2>Texto de referência</h2><pre>${escape(reference.textWithDeclaredBreaks)}</pre><h2>Símbolos recebidos</h2><ol start="0">${(comparison?.symbols ?? []).map((s) => `<li><pre>${escape(s.text)}</pre>Quebra original: ${escape(JSON.stringify(s.detectedBreak))}; posição estrutural: ${escape(s.path)}</li>`).join("")}</ol><p>Fonte local não redistribuída. Controle tipográfico do projeto, separado das 18 amostras reais. Revisão de japonês histórico permanece pendente.</p><p>Observações manuais em notes.md; regenerar HTML não chama o provider.</p></body></html>`;
}
export function writeCalibrationReport(root, id, runId) {
  const run = loadCalibrationRun(root, id, runId),
    output = path.join(run.directory, "report.html"),
    html = renderComparison(run);
  try {
    fs.lstatSync(output);
    check(
      readBounded(output, 32 * MAX_JSON)
        .toString()
        .startsWith(MARKER),
    );
    const fd = fs.openSync(
      output,
      fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW,
    );
    try {
      fs.ftruncateSync(fd, 0);
      fs.writeFileSync(fd, html);
    } finally {
      fs.closeSync(fd);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    fs.writeFileSync(output, html, { flag: "wx", mode: 0o600 });
  }
  return output;
}

export function calibrationEnvironment(options, parent = process.env) {
  return {
    ...harnessEnvironment(options, parent),
    OCR_EVAL_CALIBRATION_ID: options.calibration,
  };
}
function executeHarness(options) {
  return new Promise((done, reject) => {
    const child = spawn(
      path.join(REPO, "api/mvnw"),
      [
        "-o",
        "-B",
        "-q",
        "-pl",
        "apps/translation-gateway",
        "-am",
        "test",
        "-Dtest=ManualCalibrationEvaluationIT",
        "-Dsurefire.failIfNoSpecifiedTests=false",
      ],
      {
        cwd: path.join(REPO, "api"),
        env: calibrationEnvironment(options),
        stdio: "ignore",
      },
    );
    child.on("error", () => reject(Error("calibration-harness-unavailable")));
    child.on("exit", (code) => done(code === 0));
  });
}
export async function runCalibration(root, options, execute = executeHarness) {
  const validatedArguments = [
    "run",
    "--calibration",
    options.calibration,
    "--orientation",
    options.orientation,
  ];
  for (const key of [
    "mode",
    "run-id",
    "project",
    "bucket",
    "credentials-file",
    "service-account",
  ])
    if (options[key] !== undefined)
      validatedArguments.push(`--${key}`, options[key]);
  if (options["confirm-paid-call"])
    validatedArguments.push("--confirm-paid-call");
  parseCalibrationOptions(validatedArguments); // Also protect programmatic callers before reading files or invoking a harness.
  const input = bundleInput(root, options.calibration, options.orientation);
  const runs = path.join(input.bundle, "runs");
  fs.mkdirSync(runs, { recursive: true, mode: 0o700 });
  const directory = reserve(runs, options["run-id"]);
  const git = (args) =>
    execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  const request = {
    version: "calibration-evaluation/1",
    calibrationId: options.calibration,
    orientation: options.orientation,
    runId: options["run-id"],
    mode: options.mode,
    imageOrigin: "synthetic-control",
    responseExpected: options.mode === "offline" ? "simulated" : "vision",
    source: input.source,
    sample: input.sample,
    startedAt: new Date().toISOString(),
    gitRevision: git(["rev-parse", "HEAD"]),
    gitDirty: !!git(["status", "--porcelain"]),
    node: process.version,
    toolingSha256: hash(
      Buffer.concat([
        readBounded(SCRIPT, MAX_JSON),
        readBounded(
          path.join(path.dirname(SCRIPT), "ocr-calibration.mjs"),
          MAX_JSON,
        ),
        readBounded(
          path.join(
            REPO,
            "api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/evaluation/CalibrationAdmission.java",
          ),
          MAX_JSON,
        ),
        readBounded(
          path.join(
            REPO,
            "api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/evaluation/ManualCalibrationEvaluationIT.java",
          ),
          MAX_JSON,
        ),
      ]),
    ),
  };
  writeNew(path.join(directory, "request.json"), request);
  fs.writeFileSync(
    path.join(directory, "notes.md"),
    "# Observações\n\nSem avaliação real registrada. Não confundir simulação com reconhecimento.\n",
    { flag: "wx", mode: 0o600 },
  );
  let passed = false;
  try {
    passed = await execute(options);
  } catch {
    /* Preserve interrupted reservation; no automatic retry. */
  }
  const report = writeCalibrationReport(
    root,
    options.calibration,
    options["run-id"],
  );
  const run = loadCalibrationRun(root, options.calibration, options["run-id"]);
  check(passed && run.result.status === "succeeded");
  const comparison = {
    ...run.comparison,
    source: {
      ...input.source,
      requestSha256: run.result.requestSha256,
      rawResponseSha256: run.result.rawResponse.sha256,
      manifestSha256: run.result.manifestSha256,
      diagnosticSha256: run.result.diagnosticSha256,
    },
  };
  writeNew(path.join(directory, "comparison.json"), comparison);
  return report;
}
export async function main(args) {
  const options = parseCalibrationOptions(args);
  return options.command === "report"
    ? writeCalibrationReport(ROOT, options.calibration, options["run-id"])
    : runCalibration(ROOT, options);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main(process.argv.slice(2))
    .then((report) => console.log(report))
    .catch(() => {
      console.error(
        "calibration-evaluation-failed: consulte a rodada local; nenhuma repetição automática",
      );
      process.exitCode = 1;
    });
