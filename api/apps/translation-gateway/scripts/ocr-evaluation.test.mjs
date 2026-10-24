import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  parseOptions,
  reserveRun,
  validateResult,
  renderReport,
  main,
  harnessEnvironment,
  validateRawResponse,
} from "./ocr-evaluation.mjs";

test("unknown sample fails before allocating a run or starting Maven", async () => {
  await assert.rejects(
    main([
      "run",
      "--mode",
      "offline",
      "--run-id",
      "unknown-sample-test",
      "--sample",
      "not-in-catalog",
    ]),
    /Amostra desconhecida/,
  );
});

test("mode and per-call cost consent are mandatory; reject unknown options", () => {
  assert.throws(() => parseOptions(["run", "--run-id", "one"]));
  assert.throws(() =>
    parseOptions(["run", "--mode", "vision", "--run-id", "one"]),
  );
  assert.throws(() =>
    parseOptions(["run", "--mode", "offline", "--run-id", "../one"]),
  );
  assert.throws(() =>
    parseOptions(["run", "--mode", "offline", "--run-id", "one", "--force"]),
  );
  const result = parseOptions(["run", "--mode", "offline", "--run-id", "one"]);
  assert.equal(result.sample, "pt-ep01-p01");
  assert.equal(result.mode, "offline");
  assert.throws(() =>
    parseOptions(["report", "--run-id", "one", "--mode", "vision"]),
  );
});

test("atomic reservation admits one concurrent caller and never replaces a run", async () => {
  const root = await mkdtemp(join(tmpdir(), "ocr-eval-test-"));
  const outcomes = await Promise.allSettled([
    reserveRun(root, "one"),
    reserveRun(root, "one"),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  await writeFile(join(root, "runs/one/keep"), "original");
  await assert.rejects(reserveRun(root, "one"));
  assert.equal(await readFile(join(root, "runs/one/keep"), "utf8"), "original");
});

test("reservation rejects symlinks and traversal", async () => {
  const root = await mkdtemp(join(tmpdir(), "ocr-eval-test-"));
  const elsewhere = await mkdtemp(join(tmpdir(), "ocr-eval-elsewhere-"));
  await symlink(elsewhere, join(root, "runs"));
  await assert.rejects(reserveRun(root, "one"));
  await assert.rejects(reserveRun(root, "../escape"));
});

const sample = {
  id: "pt-ep01-p01",
  file: "pt-ep01-p01.jpg",
  language: "pt-BR",
  width: 100,
  height: 200,
  sha256: "a".repeat(64),
};
const manifest = {
  version: "1.0",
  jobRef: "20e169d0-8499-4f4c-b5ae-351dba867817",
  sourceLanguage: "pt-BR",
  widthPx: 100,
  heightPx: 200,
  regions: [
    {
      id: "20e169d0-8499-4f4c-b5ae-351dba867818",
      readingOrder: 0,
      sourceText: "<script>alert('text')</script>",
      polygon: [
        { x: 0.1, y: 0.1 },
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: 0.3 },
        { x: 0.1, y: 0.3 },
      ],
    },
  ],
};
const bytes = Buffer.from(JSON.stringify(manifest));
const result = {
  status: "succeeded",
  jobStatus: "TRANSLATING",
  stageStatus: "SUCCEEDED",
  manifestSha256: createHash("sha256").update(bytes).digest("hex"),
  jobRef: manifest.jobRef,
};

test("204 alone is not success; verify persisted states, hash and manifest", () => {
  assert.deepEqual(validateResult(result, bytes, sample), manifest);
  assert.throws(() =>
    validateResult({ ...result, stageStatus: "RUNNING" }, bytes, sample),
  );
  assert.throws(() =>
    validateResult(
      { ...result, manifestSha256: "b".repeat(64) },
      bytes,
      sample,
    ),
  );
  const invalid = Buffer.from(JSON.stringify({ ...manifest, widthPx: 500 }));
  assert.throws(() =>
    validateResult(
      {
        ...result,
        manifestSha256: createHash("sha256").update(invalid).digest("hex"),
      },
      invalid,
      sample,
    ),
  );
});

test("report escapes OCR, labels simulation, and rejects comparison across images", () => {
  const run = {
    request: {
      runId: "one",
      mode: "offline",
      sample,
      credits: "David Revoy & contributors",
    },
    result,
    manifest,
  };
  const html = renderReport([run]);
  assert.match(html, /SIMULAÇÃO/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /polygon points=/);
  assert.match(html, /Observações manuais/);
  assert.throws(() =>
    renderReport([
      run,
      {
        ...run,
        request: {
          ...run.request,
          sample: { ...sample, sha256: "b".repeat(64) },
        },
      },
    ]),
  );
});

test("CC0 report preserves mixed-language caveat and escapes item credits without provider", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL("../docs/ocr-evaluation/samples.json", import.meta.url),
    ),
  );
  const original = catalog.samples.find(
    (item) => item.id === "ja-tokyo-puck-1909-cover",
  );
  assert.ok(original);
  const html = renderReport([
    {
      request: {
        runId: "cc0-offline",
        mode: "offline",
        sample: { ...original, credits: original.credits + " <script>" },
      },
      result,
      manifest,
    },
  ]);
  assert.match(html, /SIMULAÇÃO — não reconheceu o texto da imagem/);
  assert.match(html, /CC0-1.0/);
  assert.match(html, /Rijksmuseum/);
  assert.match(html, /japonês vertical/);
  assert.match(html, /hint ja não classifica todo o texto/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|CC-BY-4.0|CC-BY-3.0/);
});

for (const [name, change] of [
  [
    "crossing geometry",
    (m) => {
      [m.regions[0].polygon[1], m.regions[0].polygon[2]] = [
        m.regions[0].polygon[2],
        m.regions[0].polygon[1],
      ];
    },
  ],
  [
    "out-of-bounds geometry",
    (m) => {
      m.regions[0].polygon[0].x = 2;
    },
  ],
  [
    "duplicate ID",
    (m) => {
      m.regions.push({ ...m.regions[0], readingOrder: 1 });
    },
  ],
  [
    "noncontiguous order",
    (m) => {
      m.regions[0].readingOrder = 2;
    },
  ],
  [
    "text excess",
    (m) => {
      m.regions[0].sourceText = "x".repeat(4097);
    },
  ],
  [
    "different job",
    (m) => {
      m.jobRef = "different";
    },
  ],
]) {
  test(`reject ${name} even with a matching file hash`, () => {
    const changed = structuredClone(manifest);
    change(changed);
    const buffer = Buffer.from(JSON.stringify(changed));
    assert.throws(() =>
      validateResult(
        {
          ...result,
          manifestSha256: createHash("sha256").update(buffer).digest("hex"),
        },
        buffer,
        sample,
      ),
    );
  });
}

test("real mode requires valid project and bucket even with cost confirmation", () => {
  assert.throws(() =>
    parseOptions([
      "run",
      "--mode",
      "vision",
      "--run-id",
      "one",
      "--confirm-paid-call",
    ]),
  );
  assert.equal(
    parseOptions([
      "run",
      "--mode",
      "vision",
      "--run-id",
      "one",
      "--confirm-paid-call",
      "--project",
      "test-project",
      "--bucket",
      "private-fixtures",
      "--credentials-file",
      "/private/ocr-eval/adc.json",
      "--service-account",
      "ocr-eval@test-project.iam.gserviceaccount.com",
    ]).mode,
    "vision",
  );
});

test("vision requires an explicit isolated credential and matching service account", () => {
  const args = [
    "run",
    "--mode",
    "vision",
    "--run-id",
    "one",
    "--project",
    "test-project",
    "--bucket",
    "private-fixtures",
    "--confirm-paid-call",
  ];
  assert.throws(() => parseOptions(args));
  assert.throws(() =>
    parseOptions([
      ...args,
      "--credentials-file",
      "relative.json",
      "--service-account",
      "ocr-eval@test-project.iam.gserviceaccount.com",
    ]),
  );
  assert.throws(() =>
    parseOptions([
      ...args,
      "--credentials-file",
      "/private/adc.json",
      "--service-account",
      "ocr-eval@another-project.iam.gserviceaccount.com",
    ]),
  );
  assert.throws(() =>
    parseOptions([
      "run",
      "--mode",
      "offline",
      "--run-id",
      "one",
      "--credentials-file",
      "/private/adc.json",
    ]),
  );
});

test("harness strips ambient cloud credentials and unsafe JVM overrides", () => {
  const inherited = {
    PATH: "/bin",
    GOOGLE_APPLICATION_CREDENTIALS: "/personal/adc",
    GOOGLE_CLOUD_QUOTA_PROJECT: "wrong",
    CLOUDSDK_CONFIG: "/personal",
    OCR_EVAL_CONFIRM_PAID_CALL: "yes",
    JAVA_TOOL_OPTIONS: "-Dgateway.ocr.mode=vision",
    MAVEN_OPTS: "-Dsomething=unsafe",
  };
  const env = harnessEnvironment(
    { mode: "offline", "run-id": "one" },
    inherited,
  );
  assert.equal(env.PATH, "/bin");
  for (const key of [
    "GOOGLE_APPLICATION_CREDENTIALS",
    "GOOGLE_CLOUD_QUOTA_PROJECT",
    "CLOUDSDK_CONFIG",
    "JAVA_TOOL_OPTIONS",
    "MAVEN_OPTS",
  ])
    assert.equal(env[key], undefined);
  assert.equal(env.OCR_EVAL_CONFIRM_PAID_CALL, "no");
  assert.equal(env.OCR_EVAL_CREDENTIALS_FILE, "");
});

test("raw artifact integrity and simulation provenance are mandatory for new runs", () => {
  const raw = Buffer.from([10, 0]);
  const capture = {
    status: "captured",
    format: "google.cloud.vision.v1.BatchAnnotateImagesResponse/protobuf",
    synthetic: true,
    bytes: raw.length,
    sha256: createHash("sha256").update(raw).digest("hex"),
  };
  assert.doesNotThrow(() => validateRawResponse(capture, raw, "offline"));
  assert.throws(() =>
    validateRawResponse(capture, Buffer.from([11, 0]), "offline"),
  );
  assert.throws(() => validateRawResponse(capture, raw, "vision"));
  assert.throws(() =>
    validateRawResponse(
      { ...capture, bytes: 4_194_305 },
      Buffer.alloc(4_194_305),
      "offline",
    ),
  );
});

test("a real-mode failure without capture must not claim observed OCR", () => {
  const html = renderReport([
    {
      request: { sample, mode: "vision", runId: "one" },
      result: { status: "failed", rawResponse: { status: "not-received" } },
      manifest: null,
    },
  ]);
  assert.match(html, /sem saída confirmada/);
  assert.doesNotMatch(html, /saída observada/);
});

test("PNG report uses item attribution and never inherits Pepper&Carrot rights", () => {
  const html = renderReport([
    {
      request: {
        mode: "offline",
        runId: "png",
        credits: "Book <author>",
        sample: {
          ...sample,
          id: "zh-hant-read-p03",
          file: "zh-hant-read-p03.png",
          mime: "image/png",
          category: "illustrated-book",
          acquisition: "local-derived",
          sourcePage:
            "https://global-asp.github.io/storybooks-hongkong/stories/zh/0087/",
          license: {
            id: "CC-BY-3.0",
            url: "https://creativecommons.org/licenses/by/3.0/",
          },
          credits: "Book <author>",
          derivation: { tool: "pdftoppm", dpi: 200 },
        },
      },
      result: { status: "failed" },
      manifest: null,
    },
  ]);
  assert.match(html, /CC-BY-3.0/);
  assert.match(html, /Book &lt;author&gt;/);
  assert.match(html, /zh-hant-read-p03.png/);
  assert.doesNotMatch(html, /by\/4.0|Pepper/);
});
