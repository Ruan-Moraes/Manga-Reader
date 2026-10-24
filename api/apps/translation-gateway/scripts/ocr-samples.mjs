import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const MAX_BYTES = 12_582_912;
const MANIFEST = new URL(
  "../docs/ocr-evaluation/samples.json",
  import.meta.url,
);
const ROOT = fileURLToPath(
  new URL("../../../../.local/ocr-samples/", import.meta.url),
);
const GALLERY_MARKER = "<!doctype html><!-- Toonlira OCR sample gallery v1 -->";
const LANGUAGES = ["ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"];
const MAX_PNG_DECODED_BYTES = 64 * 1024 * 1024;
const TOKYO_PUCK = {
  id: "ja-tokyo-puck-1909-cover",
  sourceUrl:
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Tokyo_Puck_-_Februari_1909%2C_RP-P-2005-572.jpg",
  sourcePage:
    "https://commons.wikimedia.org/wiki/File:Tokyo_Puck_-_Februari_1909,_RP-P-2005-572.jpg",
};
const BOOKS = new Map([
  [
    "https://globalstorybooks.net/media/sbhk/pdf/zh/zh-0087_read.pdf",
    "https://global-asp.github.io/storybooks-hongkong/stories/zh/0087/",
  ],
  [
    "https://globalstorybooks.net/media/sbhk/pdf/zh/zh-0006_anansi.pdf",
    "https://global-asp.github.io/storybooks-hongkong/stories/zh/0006/",
  ],
]);

function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}

export function inspectJpeg(buffer) {
  requireThat(
    buffer.length >= 4 &&
      buffer.readUInt16BE(0) === 0xffd8 &&
      buffer.readUInt16BE(buffer.length - 2) === 0xffd9,
    "JPEG inválido ou incompleto",
  );
  let offset = 2;
  while (offset < buffer.length - 1) {
    requireThat(buffer[offset++] === 0xff, "Marcador JPEG inválido");
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    requireThat(
      marker !== 0xda && marker !== 0xd9 && offset + 2 <= buffer.length,
      "Dimensões JPEG ausentes",
    );
    const length = buffer.readUInt16BE(offset);
    requireThat(
      length >= 2 && offset + length <= buffer.length,
      "Segmento JPEG incompleto",
    );
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      requireThat(length >= 8, "SOF inválido");
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      requireThat(
        width > 0 &&
          height > 0 &&
          width <= 12_000 &&
          height <= 12_000 &&
          width * height <= 80_000_000,
        "Dimensões fora do limite",
      );
      return { width, height };
    }
    offset += length;
  }
  throw new Error("Dimensões JPEG ausentes");
}

export function inspectPng(buffer) {
  requireThat(
    buffer.length <= MAX_BYTES &&
      buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
    "Assinatura PNG inválida",
  );
  let offset = 8,
    width,
    height,
    channels,
    ended = false,
    dataEnded = false;
  const data = [];
  while (offset < buffer.length) {
    requireThat(
      offset + 12 <= buffer.length && !ended,
      "PNG incompleto ou dados após IEND",
    );
    const length = buffer.readUInt32BE(offset);
    requireThat(length <= buffer.length - offset - 12, "Chunk PNG incompleto");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    requireThat(/^[A-Za-z]{4}$/.test(type), "Chunk PNG inválido");
    const content = buffer.subarray(offset + 8, offset + 8 + length);
    let crc = 0xffffffff;
    for (const byte of buffer.subarray(offset + 4, offset + 8 + length)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    requireThat(
      (crc ^ 0xffffffff) >>> 0 === buffer.readUInt32BE(offset + 8 + length),
      "CRC PNG inválido",
    );
    if (offset === 8) requireThat(type === "IHDR", "IHDR ausente");
    if (type === "IHDR") {
      requireThat(offset === 8 && length === 13, "IHDR inválido");
      width = content.readUInt32BE(0);
      height = content.readUInt32BE(4);
      requireThat(
        width > 0 &&
          height > 0 &&
          width <= 12000 &&
          height <= 12000 &&
          width * height <= 80000000,
        "Dimensões fora do limite",
      );
      requireThat(
        content[8] === 8 &&
          [2, 6].includes(content[9]) &&
          content[10] === 0 &&
          content[11] === 0 &&
          content[12] === 0,
        "PNG local exige RGB/RGBA 8 bits não entrelaçado",
      );
      channels = content[9] === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      requireThat(!dataEnded, "IDAT não contíguo");
      data.push(content);
    } else {
      if (data.length) dataEnded = true;
      if (type === "IEND") {
        requireThat(length === 0 && data.length > 0, "IEND inválido");
        ended = true;
      } else {
        requireThat(
          type === "PLTE" || type[0] === type[0].toLowerCase(),
          "Chunk crítico PNG desconhecido",
        );
        requireThat(
          !["acTL", "fcTL", "fdAT"].includes(type),
          "PNG animado não admitido",
        );
      }
    }
    offset += length + 12;
  }
  requireThat(ended, "IEND ausente");
  const stride = width * channels + 1;
  const expected = stride * height;
  requireThat(expected <= MAX_PNG_DECODED_BYTES, "PNG decodificado excedente");
  const inflated = inflateSync(Buffer.concat(data), {
    maxOutputLength: expected,
    info: true,
  });
  requireThat(
    inflated.buffer.length === expected &&
      inflated.engine.bytesWritten === Buffer.concat(data).length,
    "Fluxo PNG inválido",
  );
  for (let row = 0; row < height; row++)
    requireThat(inflated.buffer[row * stride] <= 4, "Filtro PNG inválido");
  return { width, height };
}

export function sampleRights(sample, legacyCredits = "") {
  if (sample.license?.id === "CC0-1.0") {
    requireThat(
      sample.id === TOKYO_PUCK.id &&
        sample.sourceUrl === TOKYO_PUCK.sourceUrl &&
        sample.sourcePage === TOKYO_PUCK.sourcePage &&
        sample.license.url ===
          "https://creativecommons.org/publicdomain/zero/1.0/",
      "Licença/origem CC0 individual inválida",
    );
    return {
      ...sample.license,
      sourcePage: sample.sourcePage,
      credits: sample.credits,
      changes:
        "JPEG original sem alterações. Capa histórica multilíngue: japonês vertical, inglês horizontal e possível chinês; hint ja não classifica todo o texto. Revisão linguística independente pendente; não representa mangá moderno.",
    };
  }
  if (sample.license) {
    requireThat(
      sample.license.id === "CC-BY-3.0" &&
        sample.license.url === "https://creativecommons.org/licenses/by/3.0/" &&
        [...BOOKS.values()].includes(sample.sourcePage),
      "Licença/origem individual inválida",
    );
    return {
      ...sample.license,
      sourcePage: sample.sourcePage,
      credits: sample.credits,
      changes:
        "Página inteira rasterizada do PDF; sem edição de texto ou layout.",
    };
  }
  requireThat(
    /^(en|ja|es|kr|cn|pt)-ep01-p0[12]$/.test(sample.id),
    "Atribuição ausente",
  );
  return {
    id: "CC-BY-4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    sourcePage:
      sample.sourcePage ??
      "https://www.peppercarrot.com/en/webcomic/ep01_Potion-of-Flight__hd.html",
    credits: legacyCredits,
    changes: "Exportação original, sem alterações locais.",
  };
}

function comparisonSample(manifest, sample) {
  if (sample.license)
    return manifest.samples.find((other) => other.id === sample.comparisonId);
  return manifest.samples.find(
    (other) =>
      !other.license &&
      other.language === "pt-BR" &&
      other.page === sample.page,
  );
}

export function validateManifest(manifest) {
  requireThat(
    [1, 2].includes(manifest.version) &&
      Array.isArray(manifest.samples) &&
      manifest.samples.length > 0,
    "Manifesto inválido",
  );
  const ids = new Set();
  const files = new Set();
  for (const sample of manifest.samples) {
    requireThat(
      /^[a-z0-9-]+$/.test(sample.id) &&
        sample.file ===
          `${sample.id}.${sample.mime === "image/png" ? "png" : "jpg"}` &&
        !ids.has(sample.id) &&
        !files.has(sample.file),
      "ID/arquivo inválido ou duplicado",
    );
    const individual = !!sample.license;
    if (sample.license?.id === "CC0-1.0") {
      sampleRights(sample);
      requireThat(
        manifest.version === 2 &&
          sample.mime === "image/jpeg" &&
          sample.language === "ja" &&
          sample.page === 1 &&
          sample.acquisition === "local-original" &&
          sample.category === "historical-satirical-magazine-cover" &&
          sample.orientation === "mixed-vertical-horizontal" &&
          sample.evaluationScope === "historical-multilingual" &&
          !sample.derivation &&
          !sample.comparisonId &&
          typeof sample.credits === "string" &&
          sample.credits.trim().length > 0 &&
          sample.credits.length <= 4096,
        "Procedência CC0 original inválida",
      );
    } else if (individual) {
      requireThat(
        manifest.version === 2 &&
          sample.mime === "image/png" &&
          sample.acquisition === "local-derived" &&
          sample.category === "illustrated-book" &&
          BOOKS.get(sample.sourceUrl) === sample.sourcePage,
        "Origem derivada não admitida",
      );
      sampleRights(sample);
      const d = sample.derivation;
      requireThat(
        typeof sample.credits === "string" &&
          sample.credits.trim().length > 0 &&
          sample.credits.length <= 4096 &&
          d &&
          /^[a-f0-9]{64}$/.test(d.sourceSha256) &&
          Number.isSafeInteger(d.sourceBytes) &&
          d.sourceBytes > 0 &&
          d.sourceBytes <= 20971520 &&
          d.page === sample.page &&
          d.tool === "pdftoppm" &&
          /^\d+\.\d+\.\d+$/.test(d.version) &&
          d.dpi === 200,
        "Procedência/atribuição inválida",
      );
      if (sample.comparisonId !== undefined)
        requireThat(
          comparisonSample(manifest, sample)?.language === "pt-BR",
          "Comparação pt-BR inválida",
        );
    } else {
      requireThat(
        manifest.license === "CC-BY-4.0" &&
          (!sample.mime || sample.mime === "image/jpeg") &&
          !sample.acquisition &&
          !sample.derivation &&
          !sample.comparisonId,
        "Metadados legados inválidos",
      );
      sampleRights(sample);
      const url = new URL(sample.sourceUrl);
      requireThat(
        url.origin === "https://www.peppercarrot.com" &&
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash &&
          url.pathname.startsWith("/0_sources/") &&
          url.pathname.endsWith(".jpg"),
        "Origem de download não permitida",
      );
      const page = new URL(sample.sourcePage);
      requireThat(
        page.origin === "https://www.peppercarrot.com" &&
          !page.username &&
          !page.password &&
          !page.search &&
          !page.hash,
        "Página de origem inválida",
      );
    }
    requireThat(
      LANGUAGES.includes(sample.language) &&
        Number.isInteger(sample.page) &&
        sample.page > 0 &&
        /^[a-f0-9]{64}$/.test(sample.sha256),
      "Metadados inválidos",
    );
    requireThat(
      Number.isInteger(sample.bytes) &&
        sample.bytes > 0 &&
        sample.bytes <= MAX_BYTES &&
        Number.isInteger(sample.width) &&
        Number.isInteger(sample.height) &&
        sample.width > 0 &&
        sample.height > 0 &&
        sample.width <= 12_000 &&
        sample.height <= 12_000 &&
        sample.width * sample.height <= 80_000_000,
      "Limites inválidos",
    );
    ids.add(sample.id);
    files.add(sample.file);
    requireThat(
      individual || comparisonSample(manifest, sample),
      "Comparação pt-BR ausente",
    );
  }
}

async function statOrMissing(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function ensureDirectory(path, create) {
  let stat = await statOrMissing(path);
  if (!stat && create) {
    await mkdir(path, { recursive: true, mode: 0o700 });
    stat = await lstat(path);
  }
  requireThat(
    stat?.isDirectory() && !stat.isSymbolicLink(),
    "Diretório ausente ou simbólico",
  );
}

function verifyBytes(buffer, sample) {
  requireThat(
    buffer.length === sample.bytes && buffer.length <= MAX_BYTES,
    `${sample.id}: tamanho divergente`,
  );
  requireThat(
    createHash("sha256").update(buffer).digest("hex") === sample.sha256,
    `${sample.id}: SHA-256 divergente`,
  );
  const size =
    sample.mime === "image/png" ? inspectPng(buffer) : inspectJpeg(buffer);
  requireThat(
    size.width === sample.width && size.height === sample.height,
    `${sample.id}: dimensões divergentes`,
  );
}

export async function ensureSample(
  root,
  sample,
  download = false,
  fetcher = fetch,
) {
  requireThat(
    /^[a-z0-9-]+\.(jpg|png)$/.test(sample.file),
    "Nome de arquivo inválido",
  );
  // Check existing parents before creating anything through a possible symlink.
  for (const path of [dirname(root), root, join(root, "images")]) {
    const stat = await statOrMissing(path);
    requireThat(
      !stat || (stat.isDirectory() && !stat.isSymbolicLink()),
      "Diretório simbólico não permitido",
    );
  }
  await ensureDirectory(root, download);
  await ensureDirectory(join(root, "images"), download);
  const path = join(root, "images", sample.file);
  const existing = await statOrMissing(path);
  if (existing) {
    requireThat(
      existing.isFile() &&
        !existing.isSymbolicLink() &&
        existing.size === sample.bytes,
      `${sample.id}: arquivo local divergente; preservado`,
    );
    verifyBytes(await readFile(path), sample);
    return "cached";
  }
  requireThat(
    download,
    `${sample.id}: ausente; execute download explicitamente`,
  );
  requireThat(
    sample.acquisition !== "local-derived",
    `${sample.id}: amostra derivada ausente; restaure o PNG verificado localmente, sem download automático do PDF`,
  );
  requireThat(
    sample.acquisition !== "local-original",
    `${sample.id}: original local ausente; restaure os bytes verificados, sem download automático`,
  );
  const response = await fetcher(sample.sourceUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });
  requireThat(
    response.ok &&
      response.headers.get("content-type")?.split(";")[0] === "image/jpeg",
    `${sample.id}: resposta de download inválida`,
  );
  const parts = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    requireThat(
      size <= sample.bytes && size <= MAX_BYTES,
      `${sample.id}: download excedente`,
    );
    parts.push(chunk);
  }
  const buffer = Buffer.concat(parts);
  verifyBytes(buffer, sample);
  await writeFile(path, buffer, { flag: "wx", mode: 0o600 });
  return "downloaded";
}

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

export function renderGallery(manifest) {
  const groups = [
    ...new Set(manifest.samples.map((sample) => sample.language)),
  ];
  const figure = (
    sample,
    title,
  ) => `<figure><figcaption>${escape(title)} · ${escape(sample.file)}</figcaption>
        <a href="images/${escape(sample.file)}"><img loading="lazy" src="images/${escape(sample.file)}" alt="${escape(title)} — página ${sample.page}"></a>
        <p><a href="${escape(sample.sourcePage)}">Página e créditos do autor</a></p><p>${renderAttribution(sample, manifest.credits)}</p></figure>`;
  return `${GALLERY_MARKER}
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'">
<title>Amostras OCR — comparação em português</title>
<style>body{font:16px system-ui;max-width:1500px;margin:2rem auto;padding:0 1rem;background:#f6f6f6;color:#202020}nav a{margin-right:1rem}figure{margin:0}img{width:100%;height:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0 3rem}figcaption{padding:.5rem;font-weight:bold}section{scroll-margin-top:1rem}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style></head><body>
<h1>Amostras locais para testes repetidos</h1><p>Fontes, licenças e alterações indicadas por amostra; sem endosso ao Toonlira.</p>
<p>À direita: versão editorial em português do próprio projeto — <strong>não é resultado do Toonlira</strong>, nem referência OCR independente. Clique na imagem para abrir no tamanho original. Nenhum OCR/tradutor é executado por esta página.</p>
<nav aria-label="Idiomas">${groups.map((language) => `<a href="#${escape(language)}">${escape(language)}</a>`).join("")}</nav>
${groups
  .map(
    (language) =>
      `<section id="${escape(language)}"><h2>${escape(language)}</h2>${manifest.samples
        .filter((sample) => sample.language === language)
        .map((sample) => {
          const pt = comparisonSample(manifest, sample);
          return `<h3>Página ${sample.page} · ${escape(sample.category ?? "quadrinhos")}</h3><div class="pair">${figure(sample, `Entrada ${language}`)}${pt ? figure(pt, "Comparação editorial pt-BR") : "<p>Sem comparação editorial pt-BR para esta obra.</p>"}</div>`;
        })
        .join("")}</section>`,
  )
  .join("")}
<h2>Limites</h2><p>As cenas de quadrinhos repetidas entre idiomas não são amostras independentes. Livros ilustrados não comprovam qualidade em balões de mangá. Não há referências independentes, pontuação de qualidade ou benchmark vertical completo nesta galeria.</p></body></html>`;
}

export function renderAttribution(sample, legacyCredits = "") {
  const rights = sampleRights(sample, legacyCredits);
  return `${escape(rights.credits)} · <a href="${escape(rights.url)}">${escape(rights.id)}</a> · <a href="${escape(rights.sourcePage)}">Fonte</a> · ${escape(rights.changes)} Sem endosso dos autores.`;
}

async function main() {
  const command = process.argv[2] ?? "verify";
  requireThat(
    process.argv.length <= 3 &&
      ["verify", "download", "gallery"].includes(command),
    "Uso: node api/apps/translation-gateway/scripts/ocr-samples.mjs [verify|download|gallery]",
  );
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  validateManifest(manifest);
  let downloaded = 0;
  for (const sample of manifest.samples) {
    if (
      (await ensureSample(ROOT, sample, command === "download")) ===
      "downloaded"
    )
      downloaded++;
  }
  if (command === "gallery") {
    const path = join(ROOT, "index.html");
    const stat = await statOrMissing(path);
    if (stat)
      requireThat(
        stat.isFile() &&
          !stat.isSymbolicLink() &&
          (await readFile(path, "utf8")).startsWith(GALLERY_MARKER),
        "index.html alheio; preservado",
      );
    await writeFile(path, renderGallery(manifest), { mode: 0o600 });
  }
  console.log(
    `${manifest.samples.length} amostras íntegras; ${downloaded} downloads; OCR não executado.`,
  );
  if (command === "gallery")
    console.log(`Galeria local: ${join(ROOT, "index.html")}`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
