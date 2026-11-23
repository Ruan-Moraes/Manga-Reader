import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
  mkdir,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import {
  ensureSample,
  inspectJpeg,
  inspectPng,
  renderGallery,
  renderAttribution,
  validateManifest,
} from "./ocr-samples.mjs";

function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length);
  body.copy(result, 4);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
function png(width = 1, height = 1, pixels = Buffer.from([0, 255, 255, 255])) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(pixels)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
const pngBytes = png();
const book = {
  id: "zh-hant-read-p03",
  file: "zh-hant-read-p03.png",
  mime: "image/png",
  language: "zh-Hant",
  page: 3,
  category: "illustrated-book",
  acquisition: "local-derived",
  sourceUrl: "https://globalstorybooks.net/media/sbhk/pdf/zh/zh-0087_read.pdf",
  sourcePage:
    "https://global-asp.github.io/storybooks-hongkong/stories/zh/0087/",
  license: {
    id: "CC-BY-3.0",
    url: "https://creativecommons.org/licenses/by/3.0/",
  },
  credits: "Letta Machoga; Wiehan de Jager; dohliam <test>",
  derivation: {
    sourceSha256: "a".repeat(64),
    sourceBytes: 409262,
    page: 3,
    tool: "pdftoppm",
    version: "26.05.0",
    dpi: 200,
  },
  sha256: createHash("sha256").update(pngBytes).digest("hex"),
  bytes: pngBytes.length,
  width: 1,
  height: 1,
};

test("PNG validates CRC, dimensions, complete stream and filters with bounded inflate", () => {
  assert.deepEqual(inspectPng(pngBytes), { width: 1, height: 1 });
  const corrupted = Buffer.from(pngBytes);
  corrupted[40] ^= 1;
  for (const invalid of [
    corrupted,
    pngBytes.subarray(0, -1),
    Buffer.concat([pngBytes, Buffer.from([0])]),
    png(0),
    png(12001),
    png(6000, 6000),
    png(1, 1, Buffer.from([5, 0, 0, 0])),
    png(1, 1, Buffer.alloc(100)),
  ])
    assert.throws(() => inspectPng(invalid));
});

test("mixed catalogue admits local derived PNG with item rights without inventing a Portuguese pair", async () => {
  const catalog = { version: 2, samples: [book] };
  validateManifest(catalog);
  for (const change of [
    { license: undefined },
    { credits: "" },
    { mime: "image/jpeg" },
    { sourceUrl: "https://evil.example/book.pdf" },
    { sourcePage: "javascript:alert(1)" },
    { derivation: { ...book.derivation, sourceSha256: "bad" } },
    { comparisonId: "missing" },
    { file: "../escape.png" },
  ])
    assert.throws(() =>
      validateManifest({ ...catalog, samples: [{ ...book, ...change }] }),
    );
  const html = renderGallery(catalog);
  assert.match(html, /CC-BY-3.0/);
  assert.match(html, /Sem comparação editorial pt-BR/);
  assert.match(html, /&lt;test&gt;/);
  assert.doesNotMatch(html, /CC BY 4.0|Pepper&amp;Carrot/);
  await withRoot(async (root) => {
    let calls = 0;
    const fetcher = () => {
      calls++;
      throw Error("network forbidden");
    };
    await assert.rejects(ensureSample(root, book, true, fetcher), /derivada/);
    assert.equal(calls, 0);
    await writeFile(join(root, "images", book.file), pngBytes);
    assert.equal(await ensureSample(root, book, false, fetcher), "cached");
    await assert.rejects(
      ensureSample(root, { ...book, mime: "image/jpeg" }, false, fetcher),
    );
    await assert.rejects(
      ensureSample(root, { ...book, sha256: "b".repeat(64) }, false, fetcher),
    );
  });
});

test("PNG rejects animation, duplicate headers and missing image data", () => {
  const header = pngBytes.subarray(8, 33);
  const signature = pngBytes.subarray(0, 8);
  const end = pngChunk("IEND", Buffer.alloc(0));
  for (const invalid of [
    Buffer.concat([signature, header, header, pngBytes.subarray(33)]),
    Buffer.concat([
      signature,
      header,
      pngChunk("acTL", Buffer.alloc(8)),
      pngBytes.subarray(33),
    ]),
    Buffer.concat([signature, header, end]),
  ])
    assert.throws(() => inspectPng(invalid));
});

test("catalogue rejects forged rights and file-type/provenance changes", () => {
  for (const change of [
    { license: { ...book.license, url: "javascript:alert(1)" } },
    { license: { ...book.license, id: "CC-BY-4.0" } },
    { sourceUrl: book.sourceUrl + "?download=1" },
    { sourcePage: book.sourcePage.replace("0087", "0006") },
    { acquisition: "download" },
    { derivation: { ...book.derivation, page: 4 } },
    { derivation: { ...book.derivation, sourceBytes: 0 } },
    { derivation: { ...book.derivation, dpi: 300 } },
  ])
    assert.throws(() =>
      validateManifest({ version: 2, samples: [{ ...book, ...change }] }),
    );
});

test("derived PNG symlink or corrupt bytes are refused without fetch or replacement", async () => {
  await withRoot(async (root) => {
    await writeFile(join(root, "original.png"), pngBytes);
    await symlink(join(root, "original.png"), join(root, "images", book.file));
    await assert.rejects(ensureSample(root, book));
  });
  await withRoot(async (root) => {
    const corrupted = Buffer.from(pngBytes);
    corrupted[40] ^= 1;
    await writeFile(join(root, "images", book.file), corrupted);
    await assert.rejects(
      ensureSample(
        root,
        {
          ...book,
          sha256: createHash("sha256").update(corrupted).digest("hex"),
        },
        true,
        () => {
          throw Error("network forbidden");
        },
      ),
      /CRC/,
    );
    assert.deepEqual(
      await readFile(join(root, "images", book.file)),
      corrupted,
    );
  });
});

// Minimal JPEG header for protocol tests, not an OCR/decoding quality fixture.
const bytes = Buffer.from([
  255, 216, 255, 192, 0, 17, 8, 0, 20, 0, 10, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0,
  255, 217,
]);
const sample = {
  id: "en-ep01-p01",
  file: "en-ep01-p01.jpg",
  language: "en",
  page: 1,
  sourceUrl: "https://www.peppercarrot.com/0_sources/example.jpg",
  sourcePage: "https://www.peppercarrot.com/en/webcomic/example.html",
  sha256: createHash("sha256").update(bytes).digest("hex"),
  bytes: bytes.length,
  width: 10,
  height: 20,
};

const magazine = {
  ...sample,
  id: "ja-tokyo-puck-1909-cover",
  file: "ja-tokyo-puck-1909-cover.jpg",
  mime: "image/jpeg",
  language: "ja",
  category: "historical-satirical-magazine-cover",
  acquisition: "local-original",
  orientation: "mixed-vertical-horizontal",
  evaluationScope: "historical-multilingual",
  sourceUrl:
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Tokyo_Puck_-_Februari_1909%2C_RP-P-2005-572.jpg",
  sourcePage:
    "https://commons.wikimedia.org/wiki/File:Tokyo_Puck_-_Februari_1909,_RP-P-2005-572.jpg",
  license: {
    id: "CC0-1.0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  credits: "Kitazawa Rakuten; Rijksmuseum <test>",
};

test("specific CC0 original admits historical mixed orientation without invented translation", () => {
  const catalog = { version: 2, samples: [magazine] };
  validateManifest(catalog);
  const html = renderGallery(catalog);
  assert.match(html, /CC0-1.0/);
  assert.match(html, /japonês vertical/);
  assert.match(html, /multilíngue/);
  assert.match(html, /Sem comparação editorial pt-BR/);
  assert.match(html, /&lt;test&gt;/);
  assert.doesNotMatch(html, /CC-BY-3.0|CC-BY-4.0|rasterizada/);
});

test("CC0 support does not admit another item, license, or misleading provenance", () => {
  for (const change of [
    { id: "ja-other", file: "ja-other.jpg" },
    { sourceUrl: magazine.sourceUrl + "?x=1" },
    { sourcePage: "https://commons.wikimedia.org/wiki/File:Other.jpg" },
    { license: { ...magazine.license, url: "javascript:alert(1)" } },
    { license: { ...magazine.license, id: "CC-BY-3.0" } },
    { acquisition: "download" },
    { mime: "image/png" },
    { category: "manga" },
    { orientation: "vertical" },
    { evaluationScope: undefined },
    { language: "zh-Hant" },
    { page: 2 },
    { credits: "" },
    { derivation: book.derivation },
    { comparisonId: "pt-ep01-p01" },
  ])
    assert.throws(() =>
      validateManifest({ version: 2, samples: [{ ...magazine, ...change }] }),
    );
  assert.throws(() =>
    renderAttribution({
      ...magazine,
      sourceUrl: "https://evil.example/image.jpg",
    }),
  );
});

test("local CC0 original never auto-downloads and preserves corrupt or symbolic files", async () => {
  await withRoot(async (root) => {
    let calls = 0;
    const fetcher = () => {
      calls++;
      throw Error("network forbidden");
    };
    await assert.rejects(ensureSample(root, magazine, true, fetcher), /local/);
    assert.equal(calls, 0);
    await writeFile(join(root, "images", magazine.file), bytes);
    assert.equal(await ensureSample(root, magazine, false, fetcher), "cached");
    await assert.rejects(
      ensureSample(
        root,
        { ...magazine, sha256: "0".repeat(64) },
        true,
        fetcher,
      ),
    );
    assert.deepEqual(
      await readFile(join(root, "images", magazine.file)),
      bytes,
    );
    assert.equal(calls, 0);
  });
  await withRoot(async (root) => {
    await writeFile(join(root, "original.jpg"), bytes);
    await symlink(
      join(root, "original.jpg"),
      join(root, "images", magazine.file),
    );
    await assert.rejects(ensureSample(root, magazine));
  });
});

async function withRoot(fn) {
  const root = await mkdtemp(join(tmpdir(), "toonlira-ocr-samples-test-"));
  try {
    await mkdir(join(root, "images"));
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("inspect JPEG dimensions; reject false signature, truncated segment and zero size", () => {
  assert.deepEqual(inspectJpeg(bytes), { width: 10, height: 20 });
  assert.throws(() => inspectJpeg(Buffer.from("<html>error</html>")));
  assert.throws(() => inspectJpeg(bytes.subarray(0, 12)));
  const invalid = Buffer.from(bytes);
  invalid[8] = 0;
  assert.throws(() => inspectJpeg(invalid));
});

test("verify is offline, detects missing and modified files without replacement", async () => {
  await withRoot(async (root) => {
    const neverFetch = () => {
      throw Error("network forbidden");
    };
    await assert.rejects(ensureSample(root, sample, false, neverFetch));
    await writeFile(join(root, "images", sample.file), bytes);
    assert.equal(await ensureSample(root, sample, false, neverFetch), "cached");
    await writeFile(join(root, "images", sample.file), "modified");
    await assert.rejects(ensureSample(root, sample, true, neverFetch));
    assert.equal(
      await readFile(join(root, "images", sample.file), "utf8"),
      "modified",
    );
  });
});

test("explicit download verifies before storing, second execution does not fetch", async () => {
  await withRoot(async (root) => {
    let calls = 0;
    const fetcher = async (url, options) => {
      calls++;
      assert.equal(url, sample.sourceUrl);
      assert.equal(options.redirect, "error");
      return new Response(bytes, { headers: { "content-type": "image/jpeg" } });
    };
    assert.equal(await ensureSample(root, sample, true, fetcher), "downloaded");
    assert.equal(await ensureSample(root, sample, true, fetcher), "cached");
    assert.equal(calls, 1);
  });
});

test("wrong hash, media type, size or HTTP failure never creates a sample and never retries", async () => {
  for (const response of [
    new Response("bad"),
    new Response(bytes, { status: 503 }),
    new Response(bytes, { headers: { "content-type": "text/html" } }),
    new Response(Buffer.concat([bytes, bytes]), {
      headers: { "content-type": "image/jpeg" },
    }),
  ]) {
    await withRoot(async (root) => {
      let calls = 0;
      await assert.rejects(
        ensureSample(root, sample, true, async () => {
          calls++;
          return response;
        }),
      );
      assert.equal(calls, 1);
      await assert.rejects(readFile(join(root, "images", sample.file)), {
        code: "ENOENT",
      });
    });
  }
});

test("refuses symlink samples and symlink directories", async () => {
  await withRoot(async (root) => {
    await writeFile(join(root, "outside.jpg"), bytes);
    await symlink(join(root, "outside.jpg"), join(root, "images", sample.file));
    await assert.rejects(ensureSample(root, sample, false));
  });
  await withRoot(async (root) => {
    await mkdir(join(root, "alias"));
    await symlink(join(root, "images"), join(root, "alias", "images"));
    await assert.rejects(ensureSample(join(root, "alias"), sample, true));
  });
});

test("manifest rejects duplicates, traversal, unknown origin, missing pt comparison and invalid metadata", () => {
  const pt = {
    ...sample,
    id: "pt-ep01-p01",
    file: "pt-ep01-p01.jpg",
    language: "pt-BR",
  };
  const manifest = { version: 1, license: "CC-BY-4.0", samples: [sample, pt] };
  validateManifest(manifest);
  for (const changed of [
    { file: "../x.jpg" },
    { sourceUrl: "https://example.com/x.jpg" },
    { sha256: "" },
    { width: 0 },
    { bytes: 12582913 },
    { sourceUrl: "https://www.peppercarrot.com:444/0_sources/a.jpg" },
  ]) {
    assert.throws(() =>
      validateManifest({
        ...manifest,
        samples: [{ ...sample, ...changed }, pt],
      }),
    );
  }
  assert.throws(() => validateManifest({ ...manifest, samples: [sample] }));
  assert.throws(() =>
    validateManifest({ ...manifest, samples: [sample, sample, pt] }),
  );
});

test("gallery uses local images and labels editorial Portuguese as comparison, not product output", () => {
  const pt = {
    ...sample,
    id: "pt-ep01-p01",
    file: "pt-ep01-p01.jpg",
    language: "pt-BR",
  };
  const html = renderGallery({ samples: [sample, pt] });
  assert.match(html, /images\/en-ep01-p01.jpg/);
  assert.match(html, /images\/pt-ep01-p01.jpg/);
  assert.match(html, /não é resultado do Toonlira/);
  assert.doesNotMatch(html, /<script|<img[^>]+src="https:/);
});
