import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  realpath,
  mkdir,
  writeFile,
  readFile,
  rm,
  access,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createVisualReview } from "./render-visual-review.mjs";

const languages = ["ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function fixture(t) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "visual-report-test-")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const png = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(13, 8);
  png.write("IHDR", 12);
  png.writeUInt32BE(1200, 16);
  png.writeUInt32BE(900, 20);
  const webp = Buffer.alloc(25);
  webp.write("RIFF");
  webp.writeUInt32LE(17, 4);
  webp.write("WEBPVP8L", 8);
  for (const architecture of ["arm64", "amd64"])
    for (const language of languages) {
      const directory = join(root, architecture, language);
      await mkdir(directory, { recursive: true });
      const manifest = {
        version: "1.0",
        policyVersion: "clean-box-1.1",
        jobRef: "00000000-0000-0000-0000-000000000001",
        sourceLanguage: language === "en" ? "pt-BR" : "en",
        targetLanguage: language,
        originalSha256: hash(png),
        ocrSha256: "b".repeat(64),
        translationSha256: "c".repeat(64),
        image: {
          mimeType: "image/webp",
          sha256: hash(webp),
          byteSize: webp.length,
          widthPx: 1200,
          heightPx: 900,
        },
        regions: Array.from({ length: 4 }, (_, index) => ({
          id: "00000000-0000-0000-0000-" + String(index + 1).padStart(12, "0"),
          sourceText: "synthetic source",
          readingOrder: index,
          translatedText: '<script>alert("x")</script> & café',
          polygon: [
            { x: 0.1, y: 0.1 },
            { x: 0.3, y: 0.1 },
            { x: 0.3, y: 0.3 },
            { x: 0.1, y: 0.3 },
          ],
          overflow: index === 3,
          fontSizePx: index === 3 ? 0 : 20,
        })),
      };
      const files = {
        "original.png": png,
        "rendered.webp": webp,
        "decoded.png": png,
        "manifest.json": Buffer.from(JSON.stringify(manifest)),
      };
      for (const [name, bytes] of Object.entries(files))
        await writeFile(join(directory, name), bytes);
      await writeFile(
        join(directory, "case.json"),
        JSON.stringify({
          format: "rendering-visual-case-1",
          architecture,
          targetLanguage: language,
          imageId:
            "sha256:" + (architecture === "arm64" ? "a" : "b").repeat(64),
          syntheticInputs: true,
          syntheticBindingHashes: true,
          workerIntegrationTest: false,
          realProviderCalls: 0,
          humanReview: "pending",
          changedPixels: 101,
          outsidePolygonChanges: 0,
          widthPx: 1200,
          heightPx: 900,
          files: Object.fromEntries(
            Object.entries(files).map(([name, bytes]) => [name, hash(bytes)]),
          ),
        }),
      );
    }
  return root;
}

test("offline report preserves artifacts, escapes text and never approves quality", async (t) => {
  const gallery = await fixture(t),
    output = join(gallery, "report.html");
  const original = await readFile(
    join(gallery, "arm64", "pt-BR", "original.png"),
  );
  const result = await createVisualReview({ gallery, output });
  assert.equal(result.cases, 14);
  assert.equal(result.humanApproved, false);
  const html = await readFile(output, "utf8");
  assert.ok(html.includes("SIMULAÇÃO"));
  assert.ok(html.includes("revisão visual não aprovada"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.equal((html.match(/class="case"/g) || []).length, 14);
  assert.ok(html.includes("Content-Security-Policy"));
  assert.ok(html.includes("SIL Open Font License 1.1"));
  assert.ok(!html.includes("Apache 2.0"));
  assert.deepEqual(
    await readFile(join(gallery, "arm64", "pt-BR", "original.png")),
    original,
  );
  assert.ok(
    html.includes("data:image/png;base64," + original.toString("base64")),
  );
  const capturedHtml = await readFile(output);
  await writeFile(
    join(gallery, "arm64", "pt-BR", "original.png"),
    "changed-after-report",
  );
  assert.deepEqual(await readFile(output), capturedHtml);
  await assert.rejects(
    createVisualReview({ gallery, output }),
    /visual-review-unavailable/,
  );
});

test("missing case and modified image fail before producing a report", async (t) => {
  const gallery = await fixture(t),
    output = join(gallery, "report.html");
  const file = join(gallery, "amd64", "pt-BR", "original.png");
  await writeFile(file, Buffer.from("adulterated"));
  await assert.rejects(
    createVisualReview({ gallery, output }),
    /visual-review-unavailable/,
  );
  await assert.rejects(access(output));
  await rm(join(gallery, "amd64", "pt-BR", "case.json"));
  await assert.rejects(
    createVisualReview({ gallery, output }),
    /visual-review-unavailable/,
  );
});

test("does not promote modified review state or accept output outside private gallery", async (t) => {
  const gallery = await fixture(t),
    output = join(gallery, "report.html");
  const file = join(gallery, "arm64", "en", "case.json");
  const metadata = JSON.parse(await readFile(file));
  metadata.humanReview = "approved";
  await writeFile(file, JSON.stringify(metadata));
  await assert.rejects(
    createVisualReview({ gallery, output }),
    /visual-review-unavailable/,
  );
  await assert.rejects(
    createVisualReview({
      gallery,
      output: join(gallery, "arm64", "report.html"),
    }),
    /visual-review-unavailable/,
  );
  await assert.rejects(
    createVisualReview({ gallery: "relative", output }),
    /visual-review-unavailable/,
  );
});

test("concurrent regeneration cannot overwrite another report", async (t) => {
  const gallery = await fixture(t),
    output = join(gallery, "report.html");
  const results = await Promise.allSettled([
    createVisualReview({ gallery, output }),
    createVisualReview({ gallery, output }),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
});

test("rejects rehashed invalid geometry, duplicate IDs and broken Unicode", async (t) => {
  for (const fault of ["geometry", "duplicate-id", "unicode"]) {
    const gallery = await fixture(t),
      directory = join(gallery, "arm64", "ja");
    const metadata = JSON.parse(await readFile(join(directory, "case.json")));
    const manifest = JSON.parse(
      await readFile(join(directory, "manifest.json")),
    );
    if (fault === "geometry")
      manifest.regions[0].polygon[0].x = '0.1" onload="bad';
    else if (fault === "duplicate-id")
      manifest.regions[1].id = manifest.regions[0].id;
    else manifest.regions[0].translatedText = "\uD800";
    const data = Buffer.from(JSON.stringify(manifest));
    await writeFile(join(directory, "manifest.json"), data);
    metadata.files["manifest.json"] = hash(data);
    await writeFile(join(directory, "case.json"), JSON.stringify(metadata));
    await assert.rejects(
      createVisualReview({ gallery, output: join(gallery, "report.html") }),
      /visual-review-unavailable/,
    );
  }
});

test("rejects file aliases without changing their target", async (t) => {
  const gallery = await fixture(t),
    directory = join(gallery, "arm64", "ja");
  const original = join(directory, "original.png"),
    target = join(directory, "keep.png");
  const data = await readFile(original);
  await writeFile(target, data);
  await rm(original);
  await symlink(target, original);
  await assert.rejects(
    createVisualReview({ gallery, output: join(gallery, "report.html") }),
    /visual-review-unavailable/,
  );
  assert.deepEqual(await readFile(target), data);
});
