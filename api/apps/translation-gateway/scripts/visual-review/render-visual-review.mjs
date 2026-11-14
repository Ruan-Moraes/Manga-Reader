import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const LANGUAGES = ["ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"];
const ARCHITECTURES = ["arm64", "amd64"];
const FILES = ["decoded.png", "manifest.json", "original.png", "rendered.webp"];
const WIDTH = 1200,
  HEIGHT = 900,
  MAX_FILE_BYTES = 8 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const fail = () => {
  throw new Error("visual-review-unavailable");
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const require = (condition) => {
  if (!condition) fail();
};

async function bytes(path, maximum = MAX_FILE_BYTES) {
  const before = await lstat(path);
  require(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1 &&
      before.size > 0 &&
      before.size <= maximum,
  );
  require((await realpath(path)) === path);
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = await file.stat();
    require(
      opened.ino === before.ino &&
        opened.dev === before.dev &&
        opened.size === before.size,
    );
    const data = await file.readFile();
    const after = await file.stat();
    require(
      data.length === before.size &&
        after.size === before.size &&
        after.mtimeMs === before.mtimeMs &&
        after.ctimeMs === before.ctimeMs,
    );
    return data;
  } finally {
    await file.close();
  }
}
async function json(path, maximum = 128 * 1024) {
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      await bytes(path, maximum),
    ),
  );
}
function png(data) {
  require(
    data.length >= 33 &&
      data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" &&
      data.readUInt32BE(8) === 13 &&
      data.subarray(12, 16).toString() === "IHDR" &&
      data.readUInt32BE(16) === WIDTH &&
      data.readUInt32BE(20) === HEIGHT,
  );
}
async function readCase(gallery, architecture, language, budget) {
  const directory = join(gallery, architecture, language);
  const metadata = await json(join(directory, "case.json"));
  require(
    metadata.format === "rendering-visual-case-1" &&
      metadata.architecture === architecture &&
      metadata.targetLanguage === language &&
      /^sha256:[a-f0-9]{64}$/.test(metadata.imageId) &&
      metadata.syntheticInputs === true &&
      metadata.syntheticBindingHashes === true &&
      metadata.workerIntegrationTest === false &&
      metadata.realProviderCalls === 0 &&
      metadata.humanReview === "pending" &&
      metadata.widthPx === WIDTH &&
      metadata.heightPx === HEIGHT &&
      metadata.outsidePolygonChanges === 0 &&
      Number.isSafeInteger(metadata.changedPixels) &&
      metadata.changedPixels > 100 &&
      metadata.changedPixels <= WIDTH * HEIGHT &&
      metadata.files &&
      Object.keys(metadata.files).sort().join(",") === FILES.join(","),
  );
  const files = {};
  for (const name of FILES) {
    require(HASH.test(metadata.files[name]));
    files[name] = await bytes(join(directory, name));
    budget.bytes += files[name].length;
    require(budget.bytes <= 16 * 1024 * 1024);
    require(hash(files[name]) === metadata.files[name]);
  }
  png(files["original.png"]);
  png(files["decoded.png"]);
  const webp = files["rendered.webp"];
  require(
    webp.length >= 16 &&
      webp.subarray(0, 4).toString() === "RIFF" &&
      webp.readUInt32LE(4) + 8 === webp.length &&
      webp.subarray(8, 12).toString() === "WEBP",
  );
  const manifest = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(files["manifest.json"]),
  );
  require(
    manifest.version === "1.0" &&
      manifest.policyVersion === "clean-box-1.1" &&
      UUID.test(manifest.jobRef) &&
      LANGUAGES.includes(manifest.sourceLanguage) &&
      manifest.sourceLanguage !== language &&
      manifest.ocrSha256 === "b".repeat(64) &&
      manifest.translationSha256 === "c".repeat(64) &&
      manifest.targetLanguage === language &&
      manifest.originalSha256 === metadata.files["original.png"] &&
      manifest.image?.mimeType === "image/webp" &&
      manifest.image.sha256 === metadata.files["rendered.webp"] &&
      manifest.image.byteSize === webp.length &&
      manifest.image.widthPx === WIDTH &&
      manifest.image.heightPx === HEIGHT &&
      Array.isArray(manifest.regions) &&
      manifest.regions.length === 4,
  );
  const ids = new Set();
  manifest.regions.forEach((region, index) => {
    require(
      UUID.test(region.id) &&
        !ids.has(region.id) &&
        typeof region.sourceText === "string" &&
        region.sourceText.isWellFormed() &&
        region.sourceText.trim() &&
        region.sourceText.length <= 4096,
    );
    ids.add(region.id);
    require(
      region.readingOrder === index &&
        typeof region.translatedText === "string" &&
        region.translatedText.isWellFormed() &&
        region.translatedText.trim() &&
        region.translatedText.length <= 8192 &&
        region.overflow === (index === 3) &&
        Number.isInteger(region.fontSizePx) &&
        (region.overflow
          ? region.fontSizePx === 0
          : region.fontSizePx >= 12 && region.fontSizePx <= 48) &&
        Array.isArray(region.polygon) &&
        region.polygon.length === 4,
    );
    require(
      region.polygon.every(
        (vertex) =>
          Number.isFinite(vertex.x) &&
          Number.isFinite(vertex.y) &&
          vertex.x >= 0 &&
          vertex.x <= 1 &&
          vertex.y >= 0 &&
          vertex.y <= 1,
      ),
    );
  });
  return {
    metadata,
    manifest,
    architecture,
    language,
    originalSnapshot: files["original.png"].toString("base64"),
    decodedSnapshot: files["decoded.png"].toString("base64"),
  };
}
function image(item, name, overlay = false) {
  const path = `${item.architecture}/${item.language}/${name}`;
  const polygons = item.manifest.regions
    .map(
      (region) =>
        `<polygon points="${region.polygon.map((vertex) => `${vertex.x * WIDTH},${vertex.y * HEIGHT}`).join(" ")}"/><text x="${region.polygon[0].x * WIDTH}" y="${region.polygon[0].y * HEIGHT + 18}">${region.readingOrder + 1}</text>`,
    )
    .join("");
  const snapshot =
    name === "original.png" ? item.originalSnapshot : item.decodedSnapshot;
  return `<a href="${path}" class="image"><img src="data:image/png;base64,${snapshot}" alt="${escape(item.language)} ${name}"/>${overlay ? `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-hidden="true">${polygons}</svg>` : ""}</a>`;
}
function caseHtml(item) {
  return `<article class="case"><h3>${escape(item.architecture)} · ${escape(item.language)}</h3>${image(item, "decoded.png", true)}
    <p>Imagem ${WIDTH} × ${HEIGHT}; alteração fora dos polígonos declarada pelo harness: zero. <a href="${item.architecture}/${item.language}/rendered.webp">WebP original do renderer</a></p>
    ${item.manifest.regions.map((region) => `<details><summary>Região ${region.readingOrder + 1}: ${region.overflow ? "fallback completo — não coube" : "pintada; fonte " + region.fontSizePx + " px"}</summary><pre>${escape(region.translatedText)}</pre></details>`).join("")}</article>`;
}

/** Regenerates only a bounded local HTML. Never renders, opens a client or changes an artifact. */
export async function createVisualReview(options) {
  try {
    require(
      options && Object.keys(options).sort().join(",") === "gallery,output",
    );
    const { gallery, output } = options;
    require(
      typeof gallery === "string" &&
        isAbsolute(gallery) &&
        resolve(gallery) === gallery &&
        (await realpath(gallery)) === gallery,
    );
    const directory = await lstat(gallery);
    require(
      directory.isDirectory() &&
        !directory.isSymbolicLink() &&
        (directory.mode & 0o077) === 0,
    );
    require(
      typeof output === "string" &&
        isAbsolute(output) &&
        resolve(output) === output &&
        dirname(output) === gallery &&
        /^[a-z][a-z0-9-]{0,64}\.html$/.test(basename(output)),
    );
    const cases = [];
    const budget = { bytes: 0 };
    for (const language of LANGUAGES)
      for (const architecture of ARCHITECTURES)
        cases.push(await readCase(gallery, architecture, language, budget));
    for (const architecture of ARCHITECTURES)
      require(
        new Set(
          cases
            .filter((item) => item.architecture === architecture)
            .map((item) => item.metadata.imageId),
        ).size === 1,
      );
    require(cases[0].metadata.imageId !== cases[1].metadata.imageId);
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
      <title>Revisão visual sintética — renderer</title><style>body{font:16px system-ui;margin:24px;background:#eee;color:#111}header{background:#fff3c4;padding:20px}section{margin-top:32px}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}.case{background:white;padding:16px}.image{position:relative;display:block}.image img{width:100%;display:block}.image svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}polygon{fill:none;stroke:#d20;stroke-width:2}svg text{fill:#d20;font:20px sans-serif;paint-order:stroke;stroke:white;stroke-width:3}pre{white-space:pre-wrap;overflow-wrap:anywhere}details{margin:12px 0}</style>
      <header><h1>SIMULAÇÃO · revisão visual não aprovada</h1><p>Pintura real do renderer sobre arte e textos sintéticos. Não houve OCR, tradução, provider, banco ou worker completo nesta galeria. Não é benchmark de mangá nem avaliação linguística.</p><p>Clique na imagem para conferir os pixels em tamanho integral. Polígonos e números são anotações deste relatório; não modificam o WebP. Os hashes de vínculo OCR/tradução são marcadores sintéticos.</p></header>
      <section><h2>Original gerado</h2>${image(cases[0], "original.png")}<p>Barras geométricas são placeholders, não texto reconhecido. Mesma arte sintética nos sete destinos.</p></section>
      ${LANGUAGES.map(
        (language) =>
          `<section><h2>${escape(language)}</h2><div class="pair">${cases
            .filter((item) => item.language === language)
            .map(caseHtml)
            .join("")}</div></section>`,
      ).join("")}
      <footer><h2>Revisão humana pendente</h2><p>Conferir legibilidade, contraste, quebras, recorte e indicação de overflow. Registrar observações em arquivo privado separado: este HTML não salva edições e não aprova qualidade automaticamente.</p><p>Fontes Noto Sans/Noto Sans CJK: SIL Open Font License 1.1, licenças e pins empacotados no gateway. Codec libwebp 1.6.0: COPYING/PATENTS do pacote verificado. Arte e textos são fixtures de teste do projeto.</p></footer></html>`;
    require(Buffer.byteLength(html) <= 4 * 1024 * 1024);
    await writeFile(output, html, { flag: "wx", mode: 0o600 });
    return Object.freeze({
      status: "synthetic-visual-review-not-approved",
      cases: cases.length,
      humanApproved: false,
      providerCalls: 0,
    });
  } catch {
    fail();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    require(args.length === 4);
    const options = {};
    for (let index = 0; index < args.length; index += 2) {
      require(
        ["--gallery", "--output"].includes(args[index]) &&
          !Object.hasOwn(options, args[index].slice(2)),
      );
      options[args[index].slice(2)] = args[index + 1];
    }
    console.log(JSON.stringify(await createVisualReview(options)));
  } catch {
    console.error("visual-review-unavailable");
    process.exitCode = 1;
  }
}
