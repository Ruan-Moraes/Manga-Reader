import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  symlink,
  readFile,
  writeFile,
  rename,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseOptions } from "./ocr-evaluation.mjs";
import {
  groupColumns,
  validateProfile,
  DEFAULT_PARAMETERS,
} from "./ocr-columns-core.mjs";
import {
  reserveColumns,
  renderColumns,
  validateColumns,
  runColumns,
  writeColumnsReport,
} from "./ocr-columns.mjs";

const source = {
  runId: "fixture",
  diagnosticId: "structure",
  imageSha256: "a".repeat(64),
  manifestSha256: "b".repeat(64),
  rawResponseSha256: "c".repeat(64),
  diagnosticSha256: "d".repeat(64),
  synthetic: false,
};
const paragraph = {
  kind: "paragraph",
  path: "0/0/0",
  regionId: "region",
  disposition: "retained",
};
const symbol = (i, x, y, text = "字", width = 10, height = 10) => ({
  kind: "symbol",
  path: `0/0/0/0/${i}`,
  parent: "0/0/0/0",
  text,
  geometry: "valid",
  vertices: [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ],
  normalizedVertices: [],
  confidence: null,
  detectedBreak: null,
});
function fixture(symbols) {
  const diagnostic = {
    widthPx: 1000,
    heightPx: 1000,
    nodes: [paragraph, ...symbols],
  };
  const profile = {
    version: "1.0",
    algorithmRevision: "column-candidates-1",
    source,
    selectionMethod: "manual",
    direction: "vertical-ttb-rtl",
    selection: [{ path: paragraph.path, regionId: paragraph.regionId }],
    parameters: { ...DEFAULT_PARAMETERS },
  };
  return { diagnostic, profile, source };
}
const grouped = (symbols) => {
  const f = fixture(symbols);
  return groupColumns(f.diagnostic, f.profile, f.source);
};

test("columns CLI requires all IDs and local profile, rejects cloud and mixed reports", () => {
  const args = [
    "columns",
    "--run-id",
    "one",
    "--diagnostic",
    "diag",
    "--experiment-id",
    "test",
    "--profile",
    "profile.json",
  ];
  assert.equal(parseOptions(args).command, "columns");
  for (const option of [
    "mode",
    "project",
    "bucket",
    "credentials-file",
    "confirm-paid-call",
    "model",
    "download",
    "direction",
  ])
    assert.throws(() => parseOptions([...args, `--${option}`, "value"]));
  assert.throws(() => parseOptions(args.slice(0, -2)));
  assert.throws(() => parseOptions(["columns", "--run-id", "../escape"]));
  assert.equal(
    parseOptions(["report", "--run-id", "one", "--columns", "test"]).columns,
    "test",
  );
  for (const flag of ["compare", "layout", "diagnostic"])
    assert.throws(() =>
      parseOptions([
        "report",
        "--run-id",
        "one",
        "--columns",
        "test",
        `--${flag}`,
        "other",
      ]),
    );
});

test("two shuffled columns resolve TTB and RTL without merging repeated text", () => {
  const result = grouped([
    symbol(0, 10, 30),
    symbol(1, 50, 30),
    symbol(2, 10, 10),
    symbol(3, 50, 10),
  ]);
  assert.equal(result.state, "complete");
  assert.equal(result.columns.length, 2);
  const byId = new Map(result.columns.map((c) => [c.id, c]));
  assert.deepEqual(
    result.columnOrder.flatMap((id) => byId.get(id).order),
    ["0/0/0/0/3", "0/0/0/0/1", "0/0/0/0/2", "0/0/0/0/0"],
  );
  assert.equal(new Set(result.inventory.map((i) => i.symbolId)).size, 4);
  const f = fixture([
    symbol(0, 10, 30),
    symbol(1, 50, 30),
    symbol(2, 10, 10),
    symbol(3, 50, 10),
  ]);
  assert.deepEqual(
    groupColumns(
      { ...f.diagnostic, nodes: [...f.diagnostic.nodes].reverse() },
      f.profile,
      f.source,
    ),
    result,
  );
});

test("transitive bridge without common intersection remains entirely unresolved", () => {
  const result = grouped([symbol(0, 0, 0), symbol(1, 4, 20), symbol(2, 8, 40)]);
  assert.equal(result.columns.length, 0);
  assert.equal(result.state, "inconclusive");
  assert.ok(result.inventory.every((i) => i.reason === "transitive-bridge"));
});

test("overlapping symbols and columns keep partial order without forced tie breaking", () => {
  const overlap = grouped([symbol(0, 0, 0), symbol(1, 0, 5)]);
  assert.equal(overlap.columns[0].order, null);
  assert.equal(overlap.state, "partial");
  const columns = grouped([
    symbol(0, 0, 0),
    symbol(1, 0, 20),
    symbol(2, 8, 0),
    symbol(3, 8, 20),
  ]);
  assert.equal(columns.columns.length, 2);
  assert.equal(columns.columnOrder, null);
  assert.ok(columns.ambiguities.some((a) => a.kind === "overlapping-columns"));
});

test("small punctuation, multi-character token, missing/invalid geometry and isolates stay explicit", () => {
  const missing = { ...symbol(4, 0, 0), vertices: [], geometry: "missing" };
  const invalid = {
    ...symbol(5, 0, 0),
    vertices: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ],
  };
  const result = grouped([
    symbol(0, 10, 0),
    symbol(1, 10, 20),
    symbol(2, 30, 10, "。", 2, 2),
    symbol(3, 50, 10, "二字"),
    missing,
    invalid,
    symbol(6, 90, 0),
  ]);
  assert.equal(result.inventory.length, 7);
  for (const reason of [
    "small-geometry",
    "multi-character",
    "invalid-geometry",
    "isolated",
  ])
    assert.ok(result.inventory.some((i) => i.reason === reason));
});

test("large gaps are warnings, not fabricated text or one resolved paragraph", () => {
  const result = grouped([symbol(0, 0, 0), symbol(1, 0, 100)]);
  assert.equal(result.state, "partial");
  assert.ok(result.ambiguities.some((a) => a.kind === "large-gap"));
});

test("explicit selection, source hashes, direction and limits fail closed", () => {
  const f = fixture([symbol(0, 0, 0), symbol(1, 0, 20)]);
  assert.equal(validateProfile(f.profile, f.diagnostic, f.source), f.profile);
  for (const change of [
    { direction: "ja" },
    { selection: [] },
    { selection: [{ path: "0/8/8", regionId: "unknown" }] },
    { source: { ...source, synthetic: true } },
    { parameters: { ...DEFAULT_PARAMETERS, centerFraction: 0 } },
  ])
    assert.throws(() =>
      groupColumns(f.diagnostic, { ...f.profile, ...change }, f.source),
    );
  assert.throws(() =>
    grouped(Array.from({ length: 4097 }, (_, i) => symbol(i, 0, 0))),
  );
  const other = symbol(9, 0, 0);
  other.path = "0/1/0/0/0";
  const before = JSON.stringify(f.diagnostic);
  const result = groupColumns(
    { ...f.diagnostic, nodes: [...f.diagnostic.nodes, other] },
    f.profile,
    f.source,
  );
  assert.equal(result.inventory.length, 2);
  assert.equal(JSON.stringify(f.diagnostic), before);
});

test("exclusive reservation rejects concurrent duplicate, traversal and ancestor symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "ocr-columns-"));
  await mkdir(join(root, "runs/one"), { recursive: true });
  const results = await Promise.allSettled([
    reserveColumns(root, "one", "test"),
    reserveColumns(root, "one", "test"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  await assert.rejects(reserveColumns(root, "one", "../escape"));
  await symlink(join(root, "runs/one"), join(root, "runs/link"));
  await assert.rejects(reserveColumns(root, "link", "test"));
});

test("saved validation preserves accounting and report escapes original and proposed text", () => {
  const f = fixture([
    symbol(0, 0, 0, "<"),
    symbol(1, 0, 20, ">"),
    symbol(2, 80, 0, "<script>"),
  ]);
  const result = groupColumns(f.diagnostic, f.profile, f.source);
  validateColumns(result, f.diagnostic, f.profile, f.source);
  assert.throws(() =>
    validateColumns(
      { ...result, inventory: result.inventory.slice(1) },
      f.diagnostic,
      f.profile,
      f.source,
    ),
  );
  const run = {
    request: {
      mode: "offline",
      sample: { id: "pt-ep01-p01", file: "pt-ep01-p01.jpg" },
      credits: "David Revoy",
    },
    manifest: {
      regions: [{ id: "region", readingOrder: 0, sourceText: "<script>" }],
    },
  };
  const html = renderColumns(
    run,
    f.diagnostic,
    f.profile,
    result,
    "<script>notes</script>",
  );
  assert.match(html, /SIMULAÇÃO/);
  assert.match(html, /seleção do bloco feita manualmente/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script[ >]/);
  assert.match(html, /Sem texto consolidado/);
});

test("columns tooling has no network, Google client, Java or model initialization", async () => {
  for (const name of ["ocr-columns-core.mjs", "ocr-columns.mjs"]) {
    const source = await readFile(new URL(name, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /fetch\(|spawn\(|https?:\/\/|getApplicationDefault|ImageAnnotatorClient|onnxruntime/,
    );
  }
});

async function filesystemFixture() {
  const root = await mkdtemp(join(tmpdir(), "ocr-columns-roundtrip-"));
  await mkdir(join(root, "runs/fixture"), { recursive: true });
  const f = fixture([symbol(0, 10, 10), symbol(1, 10, 30)]);
  const saved = {
    diagnostic: f.diagnostic,
    result: { diagnosticSha256: source.diagnosticSha256 },
    run: {
      request: {
        mode: "vision",
        sample: {
          id: "pt-ep01-p01",
          file: "pt-ep01-p01.jpg",
          sha256: source.imageSha256,
        },
        credits: "David Revoy",
      },
      result: {
        manifestSha256: source.manifestSha256,
        rawResponse: { sha256: source.rawResponseSha256 },
      },
      manifest: {
        regions: [{ id: "region", readingOrder: 0, sourceText: "fixture" }],
      },
    },
  };
  const profile = join(root, "profile.json");
  await writeFile(profile, JSON.stringify(f.profile));
  return {
    root,
    saved,
    profile,
    load: async () => saved,
    options: {
      "run-id": "fixture",
      diagnostic: "structure",
      "experiment-id": "one",
      profile,
    },
  };
}

test("filesystem roundtrip regenerates only HTML; duplicate and tampered artifacts fail", async () => {
  const f = await filesystemFixture();
  const path = await runColumns(f.root, f.options, f.load);
  const original = await readFile(path),
    dir = join(f.root, "runs/fixture/columns/one");
  const columns = await readFile(join(dir, "columns.json"));
  await writeColumnsReport(f.root, "fixture", "one", f.load);
  assert.deepEqual(await readFile(path), original);
  assert.deepEqual(await readFile(join(dir, "columns.json")), columns);
  await assert.rejects(runColumns(f.root, f.options, f.load));
  await writeFile(join(dir, "columns.json"), "{}");
  await assert.rejects(writeColumnsReport(f.root, "fixture", "one", f.load));
  await writeFile(join(dir, "columns.json"), columns);
  const copiedProfile = await readFile(join(dir, "profile.json"));
  await writeFile(join(dir, "profile.json"), "{}");
  await assert.rejects(writeColumnsReport(f.root, "fixture", "one", f.load));
  await writeFile(join(dir, "profile.json"), copiedProfile);
  await rename(path, join(dir, "original-report.html"));
  await symlink(join(dir, "original-report.html"), path);
  await assert.rejects(writeColumnsReport(f.root, "fixture", "one", f.load));
  assert.deepEqual(await readFile(join(dir, "original-report.html")), original);
});

test("profile symlink/size/traversal and changing source abort without automatic retry", async () => {
  const f = await filesystemFixture();
  await symlink(f.profile, join(f.root, "link.json"));
  await assert.rejects(
    runColumns(
      f.root,
      { ...f.options, profile: join(f.root, "link.json") },
      f.load,
    ),
  );
  await assert.rejects(
    runColumns(
      f.root,
      {
        ...f.options,
        profile: join(f.root, "outside/../profile.json") + "/../other",
      },
      f.load,
    ),
  );
  await writeFile(join(f.root, "oversize.json"), " ".repeat(65537));
  await assert.rejects(
    runColumns(
      f.root,
      { ...f.options, profile: join(f.root, "oversize.json") },
      f.load,
    ),
  );
  let reads = 0;
  await assert.rejects(
    runColumns(f.root, f.options, async () => {
      reads++;
      return reads === 1
        ? f.saved
        : { ...f.saved, result: { diagnosticSha256: "e".repeat(64) } };
    }),
  );
  assert.equal(reads, 2);
  const failure = JSON.parse(
    await readFile(join(f.root, "runs/fixture/columns/one/failure.json")),
  );
  assert.equal(failure.errorCode, "columns-failed");
});

test("bounded relation expansion fails without truncating a dense ambiguous fixture", () => {
  assert.throws(
    () => grouped(Array.from({ length: 300 }, (_, i) => symbol(i, 0, 0))),
    /columns-invalid-artifact/,
  );
});
