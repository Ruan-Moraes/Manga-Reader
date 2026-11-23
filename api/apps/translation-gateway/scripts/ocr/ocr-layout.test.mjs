import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseOptions } from "./ocr-evaluation.mjs";
import {
  reserveAnalysis,
  layoutEnvironment,
  renderLayoutReport,
  validateLayout,
} from "./ocr-layout.mjs";

test("layout requires explicit direction and excludes cloud flags", () => {
  assert.throws(() =>
    parseOptions(["layout", "--run-id", "run", "--analysis-id", "a"]),
  );
  assert.throws(() =>
    parseOptions([
      "layout",
      "--run-id",
      "run",
      "--analysis-id",
      "a",
      "--direction",
      "ja",
    ]),
  );
  assert.throws(() =>
    parseOptions([
      "layout",
      "--run-id",
      "run",
      "--analysis-id",
      "a",
      "--direction",
      "ltr",
      "--confirm-paid-call",
    ]),
  );
  assert.equal(
    parseOptions([
      "layout",
      "--run-id",
      "run",
      "--analysis-id",
      "a",
      "--direction",
      "ltr",
    ]).direction,
    "ltr",
  );
});

test("analysis reservation is exclusive under concurrency and rejects symbolic paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "layout-test-"));
  try {
    await mkdir(join(root, "runs"));
    await mkdir(join(root, "runs", "r"));
    const attempts = await Promise.allSettled([
      reserveAnalysis(root, "r", "a"),
      reserveAnalysis(root, "r", "a"),
    ]);
    assert.equal(
      attempts.filter((result) => result.status === "fulfilled").length,
      1,
    );
    await assert.rejects(reserveAnalysis(root, "r", "../escape"));
    await symlink(join(root, "runs", "r"), join(root, "runs", "link"));
    await assert.rejects(reserveAnalysis(root, "link", "b"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("layout execution strips Google and real-evaluation configuration", () => {
  const env = layoutEnvironment(
    { "run-id": "r", "analysis-id": "a", direction: "ltr" },
    "/model",
    {
      PATH: "/usr/bin",
      GOOGLE_APPLICATION_CREDENTIALS: "/secret",
      OCR_EVAL_CONFIRM_PAID_CALL: "yes",
      GATEWAY_STORAGE_MODE: "gcs",
      SPRING_DATASOURCE_URL: "shared",
      OCR_LAYOUT_MODEL: "old",
      JAVA_TOOL_OPTIONS: "unsafe",
    },
  );
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  assert.equal(env.SPRING_DATASOURCE_URL, undefined);
  assert.equal(env.OCR_EVAL_CONFIRM_PAID_CALL, undefined);
  assert.equal(env.OCR_LAYOUT_MODEL, "/model");
  assert.equal(env.PATH, "/usr/bin");
});

test("failed report has no invented layout and escapes OCR and credits", () => {
  const html = renderLayoutReport(
    {
      request: {
        credits: "<script>bad</script>",
        mode: "vision",
        sample: { id: "pt-ep01-p01", file: "pt-ep01-p01.jpg" },
      },
      manifest: {
        regions: [
          {
            id: "r",
            readingOrder: 0,
            sourceText: "<img onerror=bad>",
            polygon: [],
          },
        ],
      },
    },
    { status: "failed", errorCode: "layout-unavailable" },
    null,
  );
  assert.match(html, /layout experimental — não aprovado/);
  assert.match(html, /OCR reproduzido de captura anterior/);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img onerror"));
  assert.match(html, /Sem saída de layout/);
});

test("invalid or oversized layout is rejected without silently truncating", () => {
  assert.throws(() => validateLayout(Buffer.from("{}"), {}, {}));
  assert.throws(() => validateLayout(Buffer.alloc(1048577), {}, {}));
});

function fixture() {
  const winner = {
    id: "winner",
    bounds: { left: 0, top: 0, right: 1, bottom: 1 },
    confidence: 0.9,
  };
  const loser = { ...structuredClone(winner), id: "<loser>", confidence: 0.8 };
  const run = {
    request: {
      sample: {
        id: "pt-ep01-p01",
        sha256: "a".repeat(64),
        file: "pt-ep01-p01.jpg",
      },
      mode: "vision",
      credits: "credits",
    },
    result: { manifestSha256: "b".repeat(64) },
    manifest: {
      regions: [
        {
          id: "r",
          readingOrder: 0,
          sourceText: "<script>text</script>",
          polygon: [],
        },
      ],
    },
  };
  const layout = {
    layoutVersion: "1.1",
    imageSha256: run.request.sample.sha256,
    ocrManifestSha256: run.result.manifestSha256,
    algorithmRevision: "white-gutters-1-dedup-1",
    parameters: { duplicateIou: 0.95 },
    model: {
      sha256:
        "065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195",
    },
    direction: "ltr",
    state: "partial",
    panels: [],
    bubbles: [winner],
    suppressedBubbles: [
      {
        bubble: loser,
        retainedBubbleId: "winner",
        iou: 1,
        reason: "near-duplicate",
      },
    ],
    associations: [
      { regionId: "r", panelCandidates: [], bubbleCandidates: ["winner"] },
    ],
    groups: [{ bubbleId: "winner", regionIds: ["r"] }],
    suggestedOrder: ["r"],
    unassociated: ["r"],
    ambiguities: [],
  };
  return { run, layout };
}
function validateFixture(layout, run) {
  const bytes = Buffer.from(JSON.stringify(layout));
  return validateLayout(
    bytes,
    { layoutSha256: createHash("sha256").update(bytes).digest("hex") },
    run,
  );
}

test("reads historical 1.0 and audited 1.1 without inference", () => {
  const { run, layout } = fixture();
  assert.equal(validateFixture(layout, run).suppressedBubbles.length, 1);
  const legacy = structuredClone(layout);
  legacy.layoutVersion = "1.0";
  delete legacy.suppressedBubbles;
  assert.equal(validateFixture(legacy, run).layoutVersion, "1.0");
  const html = renderLayoutReport(run, { status: "succeeded" }, layout);
  assert.match(html, /candidatos: 2 · retidos: 1 · suprimidos: 1/);
  assert.match(html, /Ver caixas suprimidas/);
  assert.ok(!html.includes("<loser>"));
  assert.ok(!html.includes("<script>"));
});

test("rejects forged audit, invalid suppressed boxes and references even with a matching file hash", () => {
  for (const mutate of [
    (l) => delete l.suppressedBubbles,
    (l) => (l.suppressedBubbles[0].retainedBubbleId = "missing"),
    (l) => (l.suppressedBubbles[0].iou = 0.96),
    (l) => (l.suppressedBubbles[0].reason = "other"),
    (l) => (l.suppressedBubbles[0].bubble.id = "winner"),
    (l) => (l.suppressedBubbles[0].bubble.confidence = 1),
    (l) => (l.suppressedBubbles[0].bubble.bounds.right = 0.5),
    (l) => (l.suppressedBubbles[0].bubble.bounds.left = -1),
    (l) => (l.associations[0].bubbleCandidates = ["<loser>"]),
    (l) => (l.groups[0].bubbleId = "<loser>"),
    (l) => (l.parameters.duplicateIou = 0.5),
    (l) => (l.layoutVersion = "2.0"),
    (l) =>
      (l.suppressedBubbles = Array.from({ length: 256 }, (_, i) => ({
        ...l.suppressedBubbles[0],
        bubble: { ...l.suppressedBubbles[0].bubble, id: `b${i}` },
      }))),
  ]) {
    const { run, layout } = fixture();
    mutate(layout);
    assert.throws(() => validateFixture(layout, run));
  }
});
