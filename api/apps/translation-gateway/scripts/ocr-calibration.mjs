import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { deflateSync, inflateSync } from "node:zlib";
import { isDeepStrictEqual } from "node:util";

export const TEXT = "春夏秋冬山川草木日月星空東西南北";
const SIZE = 1200,
  CELL = 112,
  MAX_JSON = 1024 * 1024;
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SCRIPT = fileURLToPath(import.meta.url);
const RENDERER = path.join(
  path.dirname(SCRIPT),
  "CalibrationGlyphRenderer.java",
);
const REPO = path.resolve(path.dirname(SCRIPT), "../../../..");
const ROOT = path.join(REPO, ".local/ocr-samples/calibration");
const NAMES = ["horizontal", "vertical"];
const DEFAULT_RECIPE = "kanji-grid-1";
const WIDE_RECIPE = "kanji-grid-wide-1";
const REVISIONS = [DEFAULT_RECIPE, WIDE_RECIPE];
const DEFAULT_COLUMN_SPACING = 220;
const WIDE_COLUMN_SPACING = 336;
const MARKER = "<!doctype html><!-- Toonlira synthetic calibration v1 -->";
const check = (value) => {
  if (!value) throw Error("calibration-invalid-artifact");
};
const digest = (data) => createHash("sha256").update(data).digest("hex");
const same = (a, b) => isDeepStrictEqual(a, b);
const rectangle = (l, t, r, b) => [
  [l, t],
  [r, t],
  [r, b],
  [l, b],
];
const safeDirectory = (directory) => {
  const resolved = path.resolve(directory);
  let current = path.parse(resolved).root;
  for (const part of resolved
    .slice(current.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    check(stat.isDirectory() && !stat.isSymbolicLink());
  }
};
// Resolve OS-level /tmp aliases at the caller; reject symlinks inside a bundle.
export function readBounded(file, limit) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    check(stat.isFile() && stat.size <= limit);
    const buffer = Buffer.alloc(stat.size + 1);
    let size = 0,
      count;
    while (
      (count = fs.readSync(fd, buffer, size, buffer.length - size, null)) > 0
    )
      size += count;
    check(size === stat.size);
    return buffer.subarray(0, size);
  } finally {
    fs.closeSync(fd);
  }
}
const writeNew = (file, data) =>
  fs.writeFileSync(file, data, { flag: "wx", mode: 0o600 });
const jsonBytes = (value) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  check(bytes.length <= MAX_JSON);
  return bytes;
};
const readJson = (file) => JSON.parse(readBounded(file, MAX_JSON));
export function reserve(root, id) {
  check(ID.test(id));
  safeDirectory(root);
  const directory = path.join(root, id);
  fs.mkdirSync(directory, { mode: 0o700 });
  return directory;
}
export function recipe(orientation, revision = DEFAULT_RECIPE) {
  check(NAMES.includes(orientation) && REVISIONS.includes(revision));
  const spacing =
    revision === WIDE_RECIPE ? WIDE_COLUMN_SPACING : DEFAULT_COLUMN_SPACING;
  const tokens = [...TEXT].map((text, index) => {
    const group = Math.floor(index / 8),
      position = index % 8;
    const [x, y] =
      orientation === "horizontal"
        ? [208 + position * CELL, 490 + group * 220]
        : [SIZE / 2 + spacing / 2 - group * spacing, 208 + position * CELL];
    return {
      id: `t${String(index).padStart(2, "0")}`,
      order: index,
      text,
      codePoint: `U+${text.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
      group,
      centerPx: [x, y],
      cellPolygonPx: rectangle(x - 56, y - 56, x + 56, y + 56),
      breakAfter: index === 7 ? "LINE_BREAK" : null,
    };
  });
  return {
    referenceVersion: "1.0",
    recipeRevision: revision,
    origin: "synthetic-typographic-control",
    orientation,
    direction:
      orientation === "horizontal" ? "horizontal-ltr-ttb" : "vertical-ttb-rtl",
    widthPx: SIZE,
    heightPx: SIZE,
    fontSizePx: 84,
    sequence: TEXT,
    textWithDeclaredBreaks: TEXT.slice(0, 8) + "\n" + TEXT.slice(8),
    punctuation: "none",
    furigana: "none",
    tokens,
  };
}
const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const area = (points) =>
  Math.abs(
    points.reduce((sum, a, i) => {
      const b = points[(i + 1) % points.length];
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0),
  ) / 2;
function validPolygon(points) {
  if (
    !Array.isArray(points) ||
    points.length !== 4 ||
    points.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        p.some((n) => !Number.isFinite(n) || n < 0 || n > SIZE),
    )
  )
    return false;
  const values = points.map((p, i) =>
    cross(p, points[(i + 1) % 4], points[(i + 2) % 4]),
  );
  return values.every((n) => n > 1e-8) || values.every((n) => n < -1e-8);
}
export function polygonIou(first, second) {
  if (!validPolygon(first) || !validPolygon(second)) return 0;
  let clipped = first;
  const boundary =
    cross(...second.slice(0, 3)) > 0 ? second : second.toReversed();
  for (let i = 0; i < 4; i++) {
    const start = boundary[i],
      end = boundary[(i + 1) % 4],
      incoming = clipped;
    clipped = [];
    if (!incoming.length) break;
    let previous = incoming.at(-1);
    for (const point of incoming) {
      const before = cross(start, end, previous),
        side = cross(start, end, point);
      if (side >= 0 !== before >= 0) {
        const ratio = before / (before - side);
        clipped.push([
          previous[0] + ratio * (point[0] - previous[0]),
          previous[1] + ratio * (point[1] - previous[1]),
        ]);
      }
      if (side >= 0) clipped.push(point);
      previous = point;
    }
  }
  const intersection = area(clipped);
  return intersection / (area(first) + area(second) - intersection);
}
export const simulatedObservation = (r) => ({
  origin: "synthetic-test",
  symbols: r.tokens.map((t) => ({
    text: t.text,
    polygonPx: structuredClone(t.inkPolygonPx),
    breakAfter: t.breakAfter,
  })),
});
export function compareReference(reference, observed) {
  check(
    reference.origin === "synthetic-typographic-control" &&
      observed.origin === "synthetic-test",
  );
  check(
    Array.isArray(observed.symbols) &&
      observed.symbols.every((s) =>
        [null, "SPACE", "LINE_BREAK"].includes(s.breakAfter),
      ),
  );
  return {
    ...compareSymbols(reference, observed.symbols),
    evidence: "synthetic-comparator-test-only",
    providerExecuted: false,
  };
}

// Pure measurements; provenance is assigned only by the caller that validates the capture.
export function compareSymbols(reference, symbols) {
  const tokens = reference.tokens;
  check(
    Array.isArray(symbols) &&
      symbols.length <= 256 &&
      symbols.every(
        (s) =>
          s &&
          typeof s.text === "string" &&
          [...s.text].length <= 64 &&
          (s.breakAfter === null ||
            (typeof s.breakAfter === "string" && s.breakAfter.length <= 64)),
      ),
  );
  check(
    tokens.length === 16 && tokens.every((t) => validPolygon(t.inkPolygonPx)),
  );
  const matches = symbols.map((s) =>
    tokens.flatMap((t, i) =>
      polygonIou(t.inkPolygonPx, s.polygonPx) >= 0.5 ? [i] : [],
    ),
  );
  const associations = new Map(),
    ambiguous = [];
  matches.forEach((candidates, i) => {
    if (
      candidates.length === 1 &&
      matches.filter((m) => m.includes(candidates[0])).length === 1
    )
      associations.set(i, candidates[0]);
    else if (candidates.length) ambiguous.push(i);
  });
  const entries = [...associations],
    covered = new Set(associations.values());
  return {
    comparisonVersion: "1.0",
    associationRule: "mutually-unique-polygon-iou-at-least-0.5",
    sequenceExact: symbols.map((s) => s.text).join("") === reference.sequence,
    orderExact:
      same(
        [...associations.values()],
        tokens.map((_, i) => i),
      ) && symbols.length === 16,
    breaksExact:
      associations.size === 16 &&
      symbols.length === 16 &&
      entries.every(([o, r]) => symbols[o].breakAfter === tokens[r].breakAfter),
    matchedSymbols: associations.size,
    textMismatchesAtMatchedPositions: entries.filter(
      ([o, r]) => symbols[o].text !== tokens[r].text,
    ).length,
    unmatchedReference: tokens
      .filter((_, i) => !covered.has(i))
      .map((t) => t.id),
    unmatchedObserved: matches.flatMap((m, i) => (m.length ? [] : [i])),
    ambiguousObserved: ambiguous,
    invalidGeometryObserved: symbols.flatMap((s, i) =>
      validPolygon(s.polygonPx) ? [] : [i],
    ),
  };
}
function simulationChecks(references) {
  return {
    origin: "synthetic-test-only",
    providerStatus: "not-executed",
    checks: references.map((r) => {
      const perfect = compareReference(r, simulatedObservation(r));
      check(perfect.sequenceExact && perfect.orderExact && perfect.breaksExact);
      const substitution = simulatedObservation(r);
      substitution.symbols[0].text = "誤";
      check(!compareReference(r, substitution).sequenceExact);
      const reordered = simulatedObservation(r);
      reordered.symbols.reverse();
      check(!compareReference(r, reordered).orderExact);
      const missing = simulatedObservation(r);
      missing.symbols.pop();
      check(compareReference(r, missing).unmatchedReference.length);
      return {
        orientation: r.orientation,
        perfectFake: perfect,
        substitutionDetected: true,
        reorderingDetected: true,
        omissionDetected: true,
      };
    }),
  };
}

const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let i = 0; i < 8; i++)
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]),
    output = Buffer.alloc(body.length + 8);
  output.writeUInt32BE(data.length);
  body.copy(output, 4);
  output.writeUInt32BE(crc32(body), body.length + 4);
  return output;
}
export function encodePng(rgb) {
  check(rgb.length === SIZE * SIZE * 3);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8;
  header[9] = 2;
  const scan = Buffer.alloc(SIZE * (SIZE * 3 + 1));
  for (let y = 0; y < SIZE; y++)
    rgb.copy(scan, y * (SIZE * 3 + 1) + 1, y * SIZE * 3, (y + 1) * SIZE * 3);
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scan, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
export function decodePng(bytes) {
  check(bytes.subarray(0, 8).equals(PNG_SIGNATURE));
  let offset = 8,
    header = false,
    ended = false;
  const compressed = [];
  while (offset < bytes.length) {
    check(offset + 12 <= bytes.length);
    const length = bytes.readUInt32BE(offset),
      end = offset + 12 + length;
    check(end <= bytes.length);
    const type = bytes.toString("ascii", offset + 4, offset + 8),
      data = bytes.subarray(offset + 8, end - 4);
    check(
      crc32(bytes.subarray(offset + 4, end - 4)) ===
        bytes.readUInt32BE(end - 4),
    );
    if (!header) {
      check(
        type === "IHDR" &&
          length === 13 &&
          data.readUInt32BE() === SIZE &&
          data.readUInt32BE(4) === SIZE &&
          same([...data.subarray(8)], [8, 2, 0, 0, 0]),
      );
      header = true;
    } else if (type === "IDAT") compressed.push(data);
    else if (type === "IEND") {
      check(length === 0 && end === bytes.length);
      ended = true;
    } else check((bytes[offset + 4] & 32) !== 0); // Unknown critical chunks fail closed.
    offset = end;
  }
  check(ended && compressed.length);
  const stride = SIZE * 3,
    raw = inflateSync(Buffer.concat(compressed), {
      maxOutputLength: SIZE * (stride + 1),
    });
  check(raw.length === SIZE * (stride + 1));
  const pixels = Buffer.alloc(SIZE * stride);
  for (let y = 0; y < SIZE; y++) {
    const filter = raw[y * (stride + 1)];
    check(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x,
        left = x >= 3 ? pixels[index - 3] : 0,
        up = y ? pixels[index - stride] : 0,
        diagonal = y && x >= 3 ? pixels[index - stride - 3] : 0;
      const p = left + up - diagonal,
        pa = Math.abs(p - left),
        pb = Math.abs(p - up),
        pc = Math.abs(p - diagonal);
      const prediction = [
        0,
        left,
        up,
        Math.floor((left + up) / 2),
        pa <= pb && pa <= pc ? left : pb <= pc ? up : diagonal,
      ][filter];
      pixels[index] = (raw[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  return pixels;
}

export function renderGlyphs(fontPath, face) {
  check(Number.isInteger(face) && face >= 0 && face < 64);
  const bytes = readBounded(fontPath, 32 * MAX_JSON);
  const output = execFileSync(
    "java",
    ["-Djava.awt.headless=true", RENDERER, String(face)],
    {
      input: bytes,
      maxBuffer: MAX_JSON,
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  const rendered = JSON.parse(output);
  check(
    typeof rendered.java === "string" &&
      typeof rendered.family === "string" &&
      typeof rendered.style === "string" &&
      rendered.glyphs?.length === 16,
  );
  rendered.glyphs.forEach((g, i) => {
    check(
      g.codePoint === TEXT.codePointAt(i) &&
        Number.isInteger(g.glyphId) &&
        g.glyphId > 0 &&
        Number.isInteger(g.width) &&
        Number.isInteger(g.height) &&
        g.width > 0 &&
        g.height > 0 &&
        g.width < CELL &&
        g.height < CELL,
    );
    g.bytes = Buffer.from(g.mask, "base64");
    check(g.bytes.length === g.width * g.height && g.bytes.some((n) => n > 0));
  });
  return { ...rendered, fontSha256: digest(bytes) };
}
function render(reference, glyphs) {
  const pixels = Buffer.alloc(SIZE * SIZE * 3, 255);
  reference.tokens.forEach((token, i) => {
    const glyph = glyphs[i],
      left = token.centerPx[0] - Math.floor(glyph.width / 2),
      top = token.centerPx[1] - Math.floor(glyph.height / 2);
    for (let y = 0; y < glyph.height; y++)
      for (let x = 0; x < glyph.width; x++)
        pixels.fill(
          255 - glyph.bytes[y * glyph.width + x],
          ((top + y) * SIZE + left + x) * 3,
          ((top + y) * SIZE + left + x) * 3 + 3,
        );
    Object.assign(token, {
      glyphId: glyph.glyphId,
      glyphMaskSha256: digest(glyph.bytes),
      inkPolygonPx: rectangle(
        left,
        top,
        left + glyph.width,
        top + glyph.height,
      ),
      glyphMaskSize: [glyph.width, glyph.height],
    });
  });
  return encodePng(pixels);
}
export function prepare(
  root,
  id,
  fontPath,
  face = 0,
  revision = DEFAULT_RECIPE,
) {
  check(REVISIONS.includes(revision));
  const rendered = renderGlyphs(fontPath, face),
    references = NAMES.map((name) => recipe(name, revision)),
    intended = jsonBytes(references);
  const directory = reserve(root, id);
  try {
    const files = {
      "recipe.json": intended,
      "source.txt": Buffer.from(TEXT.slice(0, 8) + "\n" + TEXT.slice(8) + "\n"),
    };
    for (const reference of references) {
      const image = render(reference, rendered.glyphs);
      reference.imageSha256 = digest(image);
      files[`${reference.orientation}.png`] = image;
      files[`${reference.orientation}-reference.json`] = jsonBytes(reference);
    }
    files["simulation-tests.json"] = jsonBytes(simulationChecks(references));
    const git = (args) =>
      execFileSync("git", args, {
        cwd: REPO,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    const manifest = {
      calibrationVersion: "1.0",
      id,
      synthetic: true,
      providerStatus: "not-executed",
      createdAt: new Date().toISOString(),
      recipeRevision: revision,
      font: {
        filename: path.basename(fontPath),
        faceIndex: face,
        family: rendered.family,
        style: rendered.style,
        sha256: rendered.fontSha256,
        coverage: "physical-font-canDisplay-and-nonmissing-glyph",
        redistributed: false,
      },
      renderer: {
        node: process.version,
        java: rendered.java,
        layout: "Java2D-explicit-upright-glyph-grid-1",
        scriptSha256: digest(readBounded(SCRIPT, MAX_JSON)),
        javaSourceSha256: digest(readBounded(RENDERER, MAX_JSON)),
      },
      gitRevision: git(["rev-parse", "HEAD"]),
      gitDirty: !!git(["status", "--porcelain"]),
      limits:
        "local calibration only; not manga benchmark or linguistic approval",
      providerCalls: 0,
      credentialReads: 0,
      files: Object.fromEntries(
        Object.entries(files).map(([name, data]) => [
          name,
          { sha256: digest(data), bytes: data.length },
        ]),
      ),
    };
    for (const [name, data] of Object.entries(files))
      writeNew(path.join(directory, name), data);
    writeNew(path.join(directory, "manifest.json"), jsonBytes(manifest));
    writeReport(directory);
    return directory;
  } catch (error) {
    writeNew(
      path.join(directory, "failure.json"),
      jsonBytes({
        status: "failed",
        errorCode: "calibration-preparation-failed",
      }),
    );
    throw error;
  }
}
export function verifyBundle(directory) {
  safeDirectory(directory);
  const manifest = readJson(path.join(directory, "manifest.json"));
  check(REVISIONS.includes(manifest.recipeRevision));
  check(
    manifest.calibrationVersion === "1.0" &&
      manifest.synthetic === true &&
      manifest.providerStatus === "not-executed" &&
      manifest.providerCalls === 0 &&
      manifest.credentialReads === 0,
  );
  const expected = [
    "recipe.json",
    "source.txt",
    "simulation-tests.json",
    ...NAMES.flatMap((name) => [`${name}.png`, `${name}-reference.json`]),
  ];
  check(same(Object.keys(manifest.files).sort(), expected.sort()));
  for (const [name, record] of Object.entries(manifest.files)) {
    const data = readBounded(path.join(directory, name), 12 * MAX_JSON);
    check(data.length === record.bytes && digest(data) === record.sha256);
  }
  check(
    same(
      readJson(path.join(directory, "recipe.json")),
      NAMES.map((name) => recipe(name, manifest.recipeRevision)),
    ),
  );
  check(
    readBounded(path.join(directory, "source.txt"), 1024).toString() ==
      TEXT.slice(0, 8) + "\n" + TEXT.slice(8) + "\n",
  );
  const simulation = readJson(path.join(directory, "simulation-tests.json"));
  check(
    simulation.origin === "synthetic-test-only" &&
      simulation.providerStatus === "not-executed",
  );
  const references = [];
  for (const name of NAMES) {
    const reference = readJson(path.join(directory, `${name}-reference.json`)),
      expectedRecipe = recipe(name, manifest.recipeRevision);
    for (const [key, value] of Object.entries(expectedRecipe))
      if (key !== "tokens") check(same(reference[key], value));
    const image = readBounded(
      path.join(directory, `${name}.png`),
      12 * MAX_JSON,
    );
    check(reference.imageSha256 === digest(image));
    const pixels = decodePng(image),
      expectedPixels = Buffer.alloc(pixels.length, 255);
    check(reference.tokens.length === 16);
    reference.tokens.forEach((token, i) => {
      for (const [key, value] of Object.entries(expectedRecipe.tokens[i]))
        check(same(token[key], value));
      const polygon = token.inkPolygonPx;
      check(validPolygon(polygon) && polygon.flat().every(Number.isInteger));
      const [left, top] = polygon[0],
        [right, bottom] = polygon[2],
        width = right - left,
        height = bottom - top,
        cell = token.cellPolygonPx;
      check(
        same(polygon, rectangle(left, top, right, bottom)) &&
          cell[0][0] <= left &&
          cell[0][1] <= top &&
          right <= cell[2][0] &&
          bottom <= cell[2][1] &&
          same(token.glyphMaskSize, [width, height]),
      );
      check(
        reference.tokens
          .slice(i + 1)
          .every((t) => polygonIou(polygon, t.inkPolygonPx) === 0),
      );
      const mask = Buffer.alloc(width * height);
      let minX = width,
        minY = height,
        maxX = -1,
        maxY = -1;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const offset = ((top + y) * SIZE + left + x) * 3,
            pixel = pixels[offset];
          check(pixel === pixels[offset + 1] && pixel === pixels[offset + 2]);
          mask[y * width + x] = 255 - pixel;
          expectedPixels.fill(pixel, offset, offset + 3);
          if (pixel < 255) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      check(
        same([minX, minY, maxX, maxY], [0, 0, width - 1, height - 1]) &&
          digest(mask) === token.glyphMaskSha256,
      );
    });
    check(pixels.equals(expectedPixels));
    references.push(reference);
  }
  check(same(...references.map((r) => r.tokens.map((t) => t.glyphMaskSha256))));
  return manifest;
}
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function writeReport(directory) {
  const manifest = verifyBundle(directory);
  const panels = NAMES.map((name) => {
    const reference = readJson(path.join(directory, `${name}-reference.json`));
    const overlay = reference.tokens
      .map(
        (t) =>
          `<polygon points="${t.inkPolygonPx.map((p) => p.join(",")).join(" ")}"/><text x="${t.inkPolygonPx[0][0]}" y="${t.inkPolygonPx[0][1] - 6}">${t.order}</text>`,
      )
      .join("");
    return `<section><h2>${name}</h2><p>${reference.direction}</p><div class="image"><img src="${name}.png" alt="Controle sintético ${name}"><svg viewBox="0 0 1200 1200">${overlay}</svg></div><p><a href="${name}.png">Imagem limpa</a></p><ol start="0">${reference.tokens.map((t) => `<li>${escape(t.text)} · ${escape(t.codePoint)} · quebra após: ${escape(t.breakAfter)}</li>`).join("")}</ol></section>`;
  }).join("");
  const html = `${MARKER}<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Controle tipográfico sintético</title><style>body{font:16px system-ui;max-width:1400px;margin:auto;padding:1rem}.warning{background:#fff0b3;padding:1rem}.columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.image{position:relative}img{width:100%;display:block}svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}polygon{fill:none;stroke:#c00040;stroke-width:2}text{font-size:24px;fill:#c00040}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:700px){.columns{display:block}}</style></head><body><h1>Controles horizontal e vertical</h1><p class="warning">SINTÉTICO — nenhum OCR executado; nenhuma avaliação de qualidade real.</p><p>Sequência de calibração, não frase ou amostra de mangá. Sem pontuação, furigana ou rotação. Referência anterior ao reconhecimento.</p><div class="columns">${panels}</div><h2>Verificação técnica</h2><p>Hashes, geometria, pixels e sequência conhecidos. Saídas fabricadas testam somente o comparador; não provam qualidade do Vision.</p><h2>Reconhecimento real: PENDENTE</h2><p>Qualquer envio e custo exigem aprovação separada. Não substitui revisão linguística competente nem as 18 amostras reais.</p><h2>Proveniência</h2><p>Fonte local ${escape(manifest.font.family)} ${escape(manifest.font.style)}; não redistribuída. Texto de controle definido no projeto, não extraído de obra. Sem autorização implícita para redistribuir a fonte.</p><pre>${escape(JSON.stringify(manifest.renderer, null, 2))}</pre></body></html>`;
  const output = path.join(directory, "report.html");
  try {
    fs.lstatSync(output);
    check(
      readBounded(output, 4 * MAX_JSON)
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
    writeNew(output, html);
  }
  return output;
}
function main(args) {
  const command = args.shift();
  check(["prepare", "report"].includes(command));
  const allowed =
      command === "prepare"
        ? ["--id", "--font", "--font-index", "--recipe"]
        : ["--id"],
    options = {};
  while (args.length) {
    const key = args.shift(),
      value = args.shift();
    check(allowed.includes(key) && value !== undefined && !(key in options));
    options[key] = value;
  }
  check(ID.test(options["--id"] ?? ""));
  safeDirectory(path.dirname(ROOT));
  if (command === "prepare") {
    check(options["--font"]);
    fs.mkdirSync(ROOT, { recursive: true, mode: 0o700 });
    safeDirectory(ROOT);
    console.log(
      path.join(
        prepare(
          ROOT,
          options["--id"],
          options["--font"],
          Number(options["--font-index"] ?? 0),
          options["--recipe"] ?? DEFAULT_RECIPE,
        ),
        "report.html",
      ),
    );
  } else console.log(writeReport(path.join(ROOT, options["--id"])));
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  try {
    main(process.argv.slice(2));
  } catch {
    console.error(
      "calibration-failed: confira arquivos e requisitos locais; sem retomada automática",
    );
    process.exitCode = 1;
  }
}
