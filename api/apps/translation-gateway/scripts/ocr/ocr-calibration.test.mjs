import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import {
  TEXT,
  recipe,
  compareReference,
  simulatedObservation,
  polygonIou,
  prepare,
  verifyBundle,
  writeReport,
  reserve,
  readBounded,
  renderGlyphs,
  encodePng,
  decodePng,
} from "./ocr-calibration.mjs";

const reference = () => {
  const value = recipe("vertical");
  for (const token of value.tokens) token.inkPolygonPx = token.cellPolygonPx;
  return value;
};
const temporary = (fn) => {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "ocr-calibration-js-")),
  );
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
};

test("same known sequence with independent horizontal/vertical directions", () => {
  const h = recipe("horizontal"),
    v = recipe("vertical");
  assert.equal(h.sequence, v.sequence);
  assert.equal([...TEXT].length, 16);
  assert.equal(h.direction, "horizontal-ltr-ttb");
  assert.equal(v.direction, "vertical-ttb-rtl");
  assert.equal(h.tokens[0].centerPx[1], h.tokens[7].centerPx[1]);
  assert.ok(v.tokens[0].centerPx[0] > v.tokens[8].centerPx[0]);
  assert.equal(v.tokens.filter((t) => t.breakAfter).length, 1);
});
test("wide recipe changes only vertical column spacing and rejects unknown revisions", () => {
  const revision = "kanji-grid-wide-1";
  const base = recipe("vertical"),
    wide = recipe("vertical", revision);
  assert.equal(wide.recipeRevision, revision);
  assert.equal(wide.tokens[0].centerPx[0], 768);
  assert.equal(wide.tokens[8].centerPx[0], 432);
  for (let i = 0; i < 16; i++) {
    const expected = structuredClone(base.tokens[i]);
    const shift = i < 8 ? 58 : -58;
    expected.centerPx[0] += shift;
    expected.cellPolygonPx.forEach((p) => (p[0] += shift));
    assert.deepEqual(wide.tokens[i], expected);
  }
  assert.deepEqual(recipe("horizontal", revision), {
    ...recipe("horizontal"),
    recipeRevision: revision,
  });
  assert.throws(() => recipe("vertical", "unknown"));
});
test("perfect fake is comparator evidence, never OCR evidence", () => {
  const r = reference(),
    result = compareReference(r, simulatedObservation(r));
  assert.equal(result.matchedSymbols, 16);
  assert.ok(result.sequenceExact && result.orderExact && result.breaksExact);
  assert.equal(result.providerExecuted, false);
});
test("substitution, omission, duplicate and reordering remain visible", () => {
  const r = reference(),
    changed = simulatedObservation(r);
  changed.symbols[0].text = "誤";
  assert.equal(
    compareReference(r, changed).textMismatchesAtMatchedPositions,
    1,
  );
  const missing = simulatedObservation(r);
  missing.symbols.pop();
  assert.deepEqual(compareReference(r, missing).unmatchedReference, ["t15"]);
  const extra = simulatedObservation(r);
  extra.symbols.push(structuredClone(extra.symbols[0]));
  assert.deepEqual(compareReference(r, extra).ambiguousObserved, [0, 16]);
  const reversed = simulatedObservation(r);
  reversed.symbols.reverse();
  assert.equal(compareReference(r, reversed).orderExact, false);
});
test("breaks and invalid geometry are independent of text", () => {
  const r = reference(),
    o = simulatedObservation(r);
  o.symbols[0].breakAfter = "SPACE";
  assert.equal(compareReference(r, o).sequenceExact, true);
  assert.equal(compareReference(r, o).breaksExact, false);
  o.symbols[0].polygonPx = [
    [0, 0],
    [10, 10],
    [0, 10],
    [10, 0],
  ];
  assert.deepEqual(compareReference(r, o).invalidGeometryObserved, [0]);
  o.symbols[0].polygonPx = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  assert.ok(compareReference(r, o).unmatchedReference.includes("t00"));
});
test("reject real origin, excessive input and malformed symbols", () => {
  const r = reference(),
    o = simulatedObservation(r);
  assert.throws(() => compareReference(r, { ...o, origin: "vision" }));
  assert.throws(() =>
    compareReference(r, { ...o, symbols: Array(257).fill(o.symbols[0]) }),
  );
  assert.throws(() => compareReference(r, { ...o, symbols: [{ text: 3 }] }));
});
test("polygon IoU is not bounding-box IoU", () => {
  const square = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  assert.equal(polygonIou(square, square), 1);
  assert.equal(
    polygonIou(square, [
      [5, 0],
      [10, 5],
      [5, 10],
      [0, 5],
    ]),
    0.5,
  );
});
test("bounded reads, exclusive reservation, traversal and symlinks", () =>
  temporary((root) => {
    fs.writeFileSync(path.join(root, "data"), "12345");
    assert.throws(() => readBounded(path.join(root, "data"), 4));
    fs.symlinkSync(path.join(root, "data"), path.join(root, "link"));
    assert.throws(() => readBounded(path.join(root, "link"), 100));
    reserve(root, "one");
    assert.throws(() => reserve(root, "one"));
    assert.throws(() => reserve(root, "../escape"));
    fs.symlinkSync(path.join(root, "one"), path.join(root, "linked-root"));
    assert.throws(() => reserve(path.join(root, "linked-root"), "two"));
  }));
test("PNG encoder/decoder preserves RGB and rejects corruption", () => {
  const pixels = Buffer.alloc(1200 * 1200 * 3, 255);
  pixels[0] = 3;
  const png = encodePng(pixels);
  assert.deepEqual(decodePng(png), pixels);
  const bad = Buffer.from(png);
  bad[50] ^= 1;
  assert.throws(() => decodePng(bad));
});

test("concurrent processes reserve exactly one directory", async () => {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "ocr-calibration-race-")),
  );
  const moduleUrl = new URL("./ocr-calibration.mjs", import.meta.url).href;
  const code = `import {reserve} from ${JSON.stringify(moduleUrl)}; try {reserve(process.argv[1], 'unique');} catch {process.exitCode=1;}`;
  const attempt = () =>
    new Promise((resolve) =>
      execFile(
        process.execPath,
        ["--input-type=module", "-e", code, root],
        (error) => resolve(error ? 1 : 0),
      ),
    );
  try {
    assert.deepEqual(
      (await Promise.all([attempt(), attempt()])).sort(),
      [0, 1],
    );
    assert.deepEqual(fs.readdirSync(root), ["unique"]);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});
test("renderer rejects missing, corrupt fonts and invalid faces without fallback", () =>
  temporary((root) => {
    const bad = path.join(root, "bad.ttf");
    fs.writeFileSync(bad, "not-a-font");
    assert.throws(() => renderGlyphs(path.join(root, "absent.ttf"), 0));
    assert.throws(() => renderGlyphs(bad, 0));
    assert.throws(() => renderGlyphs(bad, -1));
  }));
test("tooling contains no Python or provider invocation", () => {
  const source = fs.readFileSync(
    new URL("./ocr-calibration.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /python|pip install|google-auth|fetch\(/i);
});
test(
  "real local font rendering, repeatability, integrity and report escape",
  {
    skip: !process.env.OCR_CALIBRATION_FONT && "explicit local font required",
  },
  () =>
    temporary((root) => {
      const font = process.env.OCR_CALIBRATION_FONT;
      const first = prepare(root, "first", font, 0),
        second = prepare(root, "second", font, 0);
      const manifest = verifyBundle(first);
      const wide = prepare(root, "wide", font, 0, "kanji-grid-wide-1");
      assert.equal(verifyBundle(wide).recipeRevision, "kanji-grid-wide-1");
      assert.deepEqual(
        fs.readFileSync(path.join(first, "horizontal.png")),
        fs.readFileSync(path.join(wide, "horizontal.png")),
      );
      const baseRef = JSON.parse(
        fs.readFileSync(path.join(first, "vertical-reference.json")),
      );
      const wideRef = JSON.parse(
        fs.readFileSync(path.join(wide, "vertical-reference.json")),
      );
      assert.deepEqual(
        baseRef.tokens.map((t) => t.glyphMaskSha256),
        wideRef.tokens.map((t) => t.glyphMaskSha256),
      );
      const wideManifestPath = path.join(wide, "manifest.json");
      const wideManifest = JSON.parse(fs.readFileSync(wideManifestPath));
      fs.writeFileSync(
        wideManifestPath,
        JSON.stringify({ ...wideManifest, recipeRevision: "kanji-grid-1" }),
      );
      assert.throws(() => verifyBundle(wide));
      fs.writeFileSync(
        wideManifestPath,
        JSON.stringify({ ...wideManifest, recipeRevision: "unknown" }),
      );
      assert.throws(() => verifyBundle(wide));
      assert.throws(() => prepare(root, "unknown", font, 0, "unknown"));
      assert.equal(fs.existsSync(path.join(root, "unknown")), false);
      assert.equal(manifest.providerStatus, "not-executed");
      assert.ok(manifest.renderer.java);
      for (const name of ["horizontal", "vertical"])
        assert.deepEqual(
          fs.readFileSync(path.join(first, `${name}.png`)),
          fs.readFileSync(path.join(second, `${name}.png`)),
        );
      const before = fs.readFileSync(path.join(first, "report.html"));
      writeReport(first);
      assert.deepEqual(
        fs.readFileSync(path.join(first, "report.html")),
        before,
      );
      const manifestPath = path.join(first, "manifest.json");
      manifest.font.family = "<script>alert(1)</script>";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      writeReport(first);
      assert.ok(
        fs
          .readFileSync(path.join(first, "report.html"), "utf8")
          .includes("&lt;script&gt;"),
      );
      fs.writeFileSync(path.join(first, "vertical.png"), "altered");
      assert.throws(() => writeReport(first));
      assert.throws(() => renderGlyphs(font, 63));
    }),
);
