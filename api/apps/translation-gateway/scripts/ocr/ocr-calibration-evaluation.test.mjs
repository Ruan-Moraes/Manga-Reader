import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { recipe, encodePng } from "./ocr-calibration.mjs";
import {
  parseCalibrationOptions,
  compareCaptured,
  renderComparison,
  runCalibration,
  loadCalibrationRun,
  writeCalibrationReport,
  calibrationEnvironment,
} from "./ocr-calibration-evaluation.mjs";

const reference = () => {
  const r = recipe("vertical");
  for (const t of r.tokens) t.inkPolygonPx = t.cellPolygonPx;
  return r;
};
const diagnostic = (r) => ({
  diagnosticVersion: "1.0",
  parserRevision: "vision-structure-1",
  mapperReplayExactlyMatches: true,
  widthPx: 1200,
  heightPx: 1200,
  nodes: [
    { kind: "page", path: "0" },
    ...r.tokens.map((t, i) => ({
      kind: "symbol",
      path: `0/0/0/0/${i}`,
      text: t.text,
      vertices: t.inkPolygonPx.map(([x, y]) => ({ x, y })),
      normalizedVertices: [],
      detectedBreak: t.breakAfter
        ? { type: t.breakAfter, isPrefix: false }
        : null,
    })),
  ],
});
test("explicit calibration/orientation and separate cloud confirmation", () => {
  const args = [
    "run",
    "--calibration",
    "control-a",
    "--orientation",
    "vertical",
    "--run-id",
    "run-a",
    "--mode",
    "offline",
  ];
  assert.equal(parseCalibrationOptions(args).mode, "offline");
  assert.throws(() =>
    parseCalibrationOptions(
      args.filter((v) => v !== "--mode" && v !== "offline"),
    ),
  );
  assert.throws(() =>
    parseCalibrationOptions([...args, "--sample", "ja-ep01-p01"]),
  );
  assert.throws(() =>
    parseCalibrationOptions(args.map((v) => (v === "offline" ? "vision" : v))),
  );
  assert.throws(() =>
    parseCalibrationOptions([...args, "--project", "test-project"]),
  );
  assert.throws(() =>
    parseCalibrationOptions([...args, "--orientation", "horizontal"]),
  );
  assert.throws(() =>
    parseCalibrationOptions(
      args.map((v) => (v === "control-a" ? "../escape" : v)),
    ),
  );
});
test("perfect synthetic capture proves comparator only, not real OCR", () => {
  const r = reference(),
    result = compareCaptured(r, diagnostic(r), "offline");
  assert.equal(result.responseOrigin, "simulated");
  assert.equal(result.imageOrigin, "synthetic-control");
  assert.equal(result.providerExecuted, false);
  assert.equal(result.sequenceExact, true);
  assert.equal(result.orderExact, true);
});
test("provider capture remains distinct from synthetic image", () => {
  const r = reference(),
    result = compareCaptured(r, diagnostic(r), "vision");
  assert.equal(result.responseOrigin, "vision-capture");
  assert.equal(result.imageOrigin, "synthetic-control");
  assert.equal(result.providerExecuted, true);
});
test("prefix and provider break types are not collapsed into normal line breaks", () => {
  const r = reference(),
    d = diagnostic(r);
  d.nodes[8].detectedBreak.isPrefix = true;
  assert.equal(compareCaptured(r, d, "offline").breaksExact, false);
  d.nodes[8].detectedBreak = { type: "EOL_SURE_SPACE", isPrefix: false };
  assert.equal(compareCaptured(r, d, "offline").breaksExact, false);
  assert.equal(compareCaptured(r, d, "offline").sequenceExact, true);
});
test("omission, substitution, duplicate, order and geometry remain separate", () => {
  const r = reference(),
    d = diagnostic(r);
  d.nodes[1].text = "誤";
  assert.equal(
    compareCaptured(r, d, "offline").textMismatchesAtMatchedPositions,
    1,
  );
  d.nodes.pop();
  assert.equal(compareCaptured(r, d, "offline").unmatchedReference.length, 1);
  d.nodes[1].normalizedVertices = [{ x: 0.5, y: 0.5 }];
  assert.deepEqual(
    compareCaptured(r, d, "offline").invalidGeometryObserved,
    [0],
  );
});
test("reject dimensions, multiple pages, duplicate paths and oversized symbols", () => {
  const r = reference(),
    d = diagnostic(r);
  assert.throws(() => compareCaptured(r, { ...d, widthPx: 1 }, "offline"));
  assert.throws(() =>
    compareCaptured(
      r,
      { ...d, nodes: [...d.nodes, { kind: "page", path: "1" }] },
      "offline",
    ),
  );
  assert.throws(() =>
    compareCaptured(r, { ...d, nodes: [...d.nodes, d.nodes[1]] }, "offline"),
  );
  d.nodes[1].text = "x".repeat(65);
  assert.throws(() => compareCaptured(r, d, "offline"));
});
test("HTML escapes extracted text and labels the simulation permanently", () => {
  const r = reference(),
    d = diagnostic(r);
  d.nodes[1].text = "<script>unsafe</script>";
  const comparison = compareCaptured(r, d, "offline");
  const html = renderComparison({
    request: { mode: "offline", orientation: "vertical", runId: "test" },
    result: { status: "succeeded" },
    comparison,
    reference: r,
  });
  assert.match(html, /SIMULAÇÃO/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

const hash = (data) => createHash("sha256").update(data).digest("hex");
const bytes = (value) => Buffer.from(JSON.stringify(value));
function fixture(root) {
  const bundle = path.join(root, "control");
  fs.mkdirSync(bundle);
  const files = {
    "recipe.json": bytes([recipe("horizontal"), recipe("vertical")]),
    "source.txt": Buffer.from("春夏秋冬山川草木\n日月星空東西南北\n"),
    "simulation-tests.json": bytes({
      origin: "synthetic-test-only",
      providerStatus: "not-executed",
    }),
  };
  for (const orientation of ["horizontal", "vertical"]) {
    const r = recipe(orientation),
      pixels = Buffer.alloc(1200 * 1200 * 3, 255);
    for (const token of r.tokens) {
      const [x, y] = token.centerPx;
      pixels.fill(0, (y * 1200 + x) * 3, (y * 1200 + x) * 3 + 3);
      Object.assign(token, {
        inkPolygonPx: [
          [x, y],
          [x + 1, y],
          [x + 1, y + 1],
          [x, y + 1],
        ],
        glyphMaskSize: [1, 1],
        glyphMaskSha256: hash(Buffer.from([255])),
      });
    }
    const image = encodePng(pixels);
    r.imageSha256 = hash(image);
    files[`${orientation}.png`] = image;
    files[`${orientation}-reference.json`] = bytes(r);
  }
  for (const [name, data] of Object.entries(files))
    fs.writeFileSync(path.join(bundle, name), data);
  fs.writeFileSync(
    path.join(bundle, "manifest.json"),
    bytes({
      id: "control",
      calibrationVersion: "1.0",
      synthetic: true,
      recipeRevision: "kanji-grid-1",
      providerStatus: "not-executed",
      providerCalls: 0,
      credentialReads: 0,
      files: Object.fromEntries(
        Object.entries(files).map(([name, data]) => [
          name,
          { sha256: hash(data), bytes: data.length },
        ]),
      ),
    }),
  );
  return bundle;
}
function fakeResult(bundle, runId) {
  const directory = path.join(bundle, "runs", runId),
    requestBytes = fs.readFileSync(path.join(directory, "request.json")),
    request = JSON.parse(requestBytes);
  const r = JSON.parse(
    fs.readFileSync(path.join(bundle, `${request.orientation}-reference.json`)),
  );
  const raw = Buffer.from("fake protobuf, Node file-boundary test only"),
    d = bytes(diagnostic(r));
  const manifest = bytes({
    version: "1.0",
    jobRef: "00000000-0000-0000-0000-000000000001",
    sourceLanguage: "ja",
    widthPx: 1200,
    heightPx: 1200,
    regions: [],
  });
  const result = {
    status: "succeeded",
    stageStatus: "SUCCEEDED",
    jobStatus: "TRANSLATING",
    jobRef: "00000000-0000-0000-0000-000000000001",
    manifestSha256: hash(manifest),
    requestSha256: hash(requestBytes),
    referenceSha256: request.source.referenceSha256,
    diagnosticSha256: hash(d),
    rawResponse: {
      status: "captured",
      synthetic: true,
      format: "google.cloud.vision.v1.BatchAnnotateImagesResponse/protobuf",
      sha256: hash(raw),
      bytes: raw.length,
    },
  };
  for (const [name, data] of Object.entries({
    "result.json": bytes(result),
    "manifest.json": manifest,
    "diagnostic.json": d,
    "vision-response.pb": raw,
  }))
    fs.writeFileSync(path.join(directory, name), data);
}
const options = (id) => ({
  command: "run",
  calibration: "control",
  orientation: "vertical",
  mode: "offline",
  "run-id": id,
});
test("file chain, exclusive run, deterministic report and tampering", async () => {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "calibration-chain-")),
  );
  try {
    const bundle = fixture(root),
      original = fs.readFileSync(path.join(bundle, "vertical.png"));
    let calls = 0;
    const report = await runCalibration(root, options("one"), async () => {
      calls++;
      fakeResult(bundle, "one");
      return true;
    });
    assert.equal(calls, 1);
    assert.equal(
      loadCalibrationRun(root, "control", "one").result.status,
      "succeeded",
    );
    const html = fs.readFileSync(report);
    writeCalibrationReport(root, "control", "one");
    assert.deepEqual(fs.readFileSync(report), html);
    assert.deepEqual(
      fs.readFileSync(path.join(bundle, "vertical.png")),
      original,
    );
    await assert.rejects(
      runCalibration(root, options("one"), async () => {
        calls++;
      }),
    );
    assert.equal(calls, 1);
    fs.appendFileSync(
      path.join(bundle, "runs/one/vision-response.pb"),
      "changed",
    );
    const invalid = loadCalibrationRun(root, "control", "one");
    assert.equal(invalid.result.status, "failed");
    assert.equal(invalid.comparison, null);
    writeCalibrationReport(root, "control", "one");
    assert.match(fs.readFileSync(report, "utf8"), /Sem captura válida/);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});
test("concurrent reservation, interruption and report never resume provider", async () => {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "calibration-interrupted-")),
  );
  try {
    fixture(root);
    let calls = 0;
    await Promise.allSettled(
      [1, 2].map(() =>
        runCalibration(root, options("same"), async () => {
          calls++;
          throw Error("failure");
        }),
      ),
    );
    assert.equal(calls, 1);
    assert.equal(
      loadCalibrationRun(root, "control", "same").result.status,
      "interrupted",
    );
    writeCalibrationReport(root, "control", "same");
    assert.equal(calls, 1);
    await assert.rejects(
      runCalibration(root, { ...options("real"), mode: "vision" }, async () => {
        calls++;
      }),
    );
    assert.equal(calls, 1);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});
test("reference and diagnostic hash changes cannot produce measurements", async () => {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "calibration-hashes-")),
  );
  try {
    const bundle = fixture(root);
    await runCalibration(root, options("one"), async () => {
      fakeResult(bundle, "one");
      return true;
    });
    fs.appendFileSync(path.join(bundle, "runs/one/diagnostic.json"), " ");
    assert.equal(loadCalibrationRun(root, "control", "one").comparison, null);
    fs.appendFileSync(path.join(bundle, "vertical-reference.json"), " ");
    assert.throws(() => loadCalibrationRun(root, "control", "one"));
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});
test("offline environment strips inherited cloud credentials and JVM overrides", () => {
  const env = calibrationEnvironment(options("one"), {
    PATH: "safe",
    GOOGLE_APPLICATION_CREDENTIALS: "secret",
    OCR_EVAL_CONFIRM_PAID_CALL: "yes",
    JAVA_TOOL_OPTIONS: "unsafe",
    GATEWAY_ENABLED: "true",
  });
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  assert.equal(env.JAVA_TOOL_OPTIONS, undefined);
  assert.equal(env.OCR_EVAL_CONFIRM_PAID_CALL, "no");
  assert.equal(env.OCR_EVAL_CREDENTIALS_FILE, "");
  assert.equal(env.OCR_EVAL_CALIBRATION_ID, "control");
});
