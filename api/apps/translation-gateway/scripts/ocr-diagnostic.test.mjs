import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { parseOptions } from "./ocr-evaluation.mjs";
import {
  reserveDiagnostic,
  diagnosticEnvironment,
  renderDiagnostic,
  validateDiagnostic,
  validateSavedDiagnostic,
  readDiagnosticFile,
} from "./ocr-diagnostic.mjs";

test("bounded file reads reject missing, oversized, directory and symbolic inputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "ocr-diagnostic-file-"));
  const path = join(root, "data");
  await writeFile(path, "private");
  await symlink(path, join(root, "link"));
  await assert.rejects(readDiagnosticFile(join(root, "missing"), 100));
  await assert.rejects(readDiagnosticFile(path, 2));
  await assert.rejects(readDiagnosticFile(root, 100));
  await assert.rejects(readDiagnosticFile(join(root, "link"), 100));
  assert.equal((await readDiagnosticFile(path, 100)).toString(), "private");
});

test("diagnose requires analysis ID and refuses every cloud/inference option", () => {
  const args = ["diagnose", "--run-id", "one", "--analysis-id", "inspect"];
  assert.equal(parseOptions(args).command, "diagnose");
  for (const key of [
    "project",
    "bucket",
    "credentials-file",
    "confirm-paid-call",
    "mode",
    "model",
    "download",
    "direction",
  ])
    assert.throws(() => parseOptions([...args, `--${key}`, "value"]));
  assert.throws(() => parseOptions(["diagnose", "--run-id", "one"]));
  assert.throws(() => parseOptions([...args.slice(0, -1), "../escape"]));
  assert.equal(
    parseOptions(["report", "--run-id", "one", "--diagnostic", "inspect"])
      .diagnostic,
    "inspect",
  );
  assert.throws(() =>
    parseOptions([
      "report",
      "--run-id",
      "one",
      "--diagnostic",
      "inspect",
      "--compare",
      "two",
    ]),
  );
});

test("exclusive diagnostic reservation protects originals, rejects symlinks and traversal", async () => {
  const root = await mkdtemp(join(tmpdir(), "ocr-diagnostic-"));
  await mkdir(join(root, "runs/one"), { recursive: true });
  await writeFile(join(root, "runs/one/manifest.json"), "original");
  const outcomes = await Promise.allSettled([
    reserveDiagnostic(root, "one", "inspect"),
    reserveDiagnostic(root, "one", "inspect"),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    await readFile(join(root, "runs/one/manifest.json"), "utf8"),
    "original",
  );
  await assert.rejects(reserveDiagnostic(root, "one", "../escape"));
  await symlink(join(root, "runs/one"), join(root, "runs/link"));
  await assert.rejects(reserveDiagnostic(root, "link", "inspect"));
  await mkdir(join(root, "runs/two"));
  await symlink(join(root, "runs/one"), join(root, "runs/two/diagnostics"));
  await assert.rejects(reserveDiagnostic(root, "two", "inspect"));
});

test("child environment is allowlisted: no ADC, Java agents, Maven or cloud settings", () => {
  assert.deepEqual(
    diagnosticEnvironment({
      PATH: "/bin",
      JAVA_HOME: "/jdk",
      HOME: "/home/private",
      GOOGLE_APPLICATION_CREDENTIALS: "/secret",
      JAVA_TOOL_OPTIONS: "-javaagent:evil",
      OCR_EVAL_MODE: "vision",
    }),
    { PATH: "/bin", JAVA_HOME: "/jdk" },
  );
});

const diagnostic = {
  diagnosticVersion: "1.0",
  parserRevision: "vision-structure-1",
  mapperReplayExactlyMatches: true,
  widthPx: 100,
  heightPx: 200,
  nodes: [
    {
      path: "0/0/0",
      parent: "0/0",
      kind: "paragraph",
      regionId: "id",
      disposition: "retained",
      readingOrder: 0,
      text: null,
      confidence: null,
      detectedBreak: null,
      vertices: [
        { x: 1, y: 1 },
        { x: 20, y: 1 },
        { x: 20, y: 10 },
        { x: 1, y: 10 },
      ],
      normalizedVertices: [],
      geometry: "valid",
      aspectHint: "wide",
    },
    {
      path: "0/0/0/0/0",
      parent: "0/0/0/0",
      kind: "symbol",
      text: "<script>&秘密",
      confidence: null,
      detectedBreak: null,
      vertices: [],
      normalizedVertices: [],
      geometry: "missing",
      aspectHint: "unknown",
    },
  ],
};
const run = {
  request: {
    mode: "vision",
    runId: "one",
    sample: {
      id: "pt-ep01-p01",
      file: "pt-ep01-p01.jpg",
      width: 100,
      height: 200,
    },
    credits: "David Revoy",
  },
  manifest: { regions: [{ id: "id", readingOrder: 0 }] },
};
test("diagnostic validates schema, rejects impossible replay and unsafe geometry", () => {
  assert.equal(validateDiagnostic(diagnostic, run), diagnostic);
  assert.throws(() =>
    validateDiagnostic(
      { ...diagnostic, mapperReplayExactlyMatches: false },
      run,
    ),
  );
  assert.throws(() =>
    validateDiagnostic(
      {
        ...diagnostic,
        nodes: [
          { ...diagnostic.nodes[0], vertices: [{ x: '" onload="evil', y: 0 }] },
        ],
      },
      run,
    ),
  );
});
test("report escapes text, shows provenance and absent confidence, does not reorder or infer", () => {
  const before = JSON.stringify(diagnostic);
  const html = renderDiagnostic(run, diagnostic);
  assert.match(html, /&lt;script&gt;&amp;/);
  assert.doesNotMatch(html, /<script[ >]/);
  assert.match(html, /não informada/);
  assert.match(html, /Sequência original/);
  assert.match(html, /Reorganização não executada/);
  assert.match(
    renderDiagnostic(
      { ...run, request: { ...run.request, mode: "offline" } },
      diagnostic,
    ),
    /SIMULAÇÃO/,
  );
  assert.equal(JSON.stringify(diagnostic), before);
});

test("regeneration rejects corrupted JSON, hash, source binding, provenance and overflow", () => {
  const input = {
    ...run,
    result: {
      manifestSha256: "b".repeat(64),
      rawResponse: { sha256: "c".repeat(64) },
    },
  };
  const metadata = {
    diagnosticVersion: "1.0",
    parserRevision: "vision-structure-1",
    runId: "one",
    analysisId: "inspect",
    sampleId: run.request.sample.id,
    imageSha256: run.request.sample.sha256,
    manifestSha256: input.result.manifestSha256,
    rawResponseSha256: input.result.rawResponse.sha256,
    synthetic: false,
  };
  const bytes = Buffer.from(JSON.stringify(diagnostic));
  const result = {
    status: "succeeded",
    diagnosticSha256: createHash("sha256").update(bytes).digest("hex"),
  };
  assert.deepEqual(
    validateSavedDiagnostic(bytes, metadata, result, input, "one", "inspect"),
    diagnostic,
  );
  for (const key of [
    "imageSha256",
    "manifestSha256",
    "rawResponseSha256",
    "runId",
    "analysisId",
    "synthetic",
  ])
    assert.throws(() =>
      validateSavedDiagnostic(
        bytes,
        { ...metadata, [key]: "wrong" },
        result,
        input,
        "one",
        "inspect",
      ),
    );
  for (const bad of [
    Buffer.from("{"),
    Buffer.from("tampered"),
    Buffer.alloc(16 * 1024 * 1024 + 1),
  ])
    assert.throws(() =>
      validateSavedDiagnostic(bad, metadata, result, input, "one", "inspect"),
    );
});

test("offline parser has no clients, credential initialization, Spring, JDBC or inference imports", async () => {
  const source = await readFile(
    new URL(
      "../src/test/java/com/toonlira/translationgateway/evaluation/VisionDiagnostic.java",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /import .*?(ImageAnnotatorClient|Credentials|springframework|java\.sql|onnx|StorageOptions|TasksClient)/,
  );
  assert.doesNotMatch(
    source,
    /getApplicationDefault|URL\(|HttpClient|Socket\(/,
  );
});
