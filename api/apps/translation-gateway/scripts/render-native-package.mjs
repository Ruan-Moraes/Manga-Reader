import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_LIBRARY_BYTES = 32 * 1024 * 1024;
export const SOURCE_HASH =
  "e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564";
export const LICENSE_HASHES = Object.freeze({
  COPYING: "5aec868f669e384a22372a4e8a1a6cd7d44c64cd451f960ca69cc170d1e13acf",
  PATENTS: "cc3273e0694ea5896145e0677699b53471b03ea43021ddc50e7923fbb9f5023c",
});
const OPTIONS = [
  "destination",
  "webp",
  "sharp",
  "copying",
  "patents",
  "webp-sha256",
  "sharp-sha256",
];
const PLATFORMS = [
  "linux-aarch64-musl",
  "linux-x86_64-musl",
  "linux-aarch64-glibc",
  "linux-x86_64-glibc",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = () => {
  throw new Error("render-package-unavailable");
};

export function parsePackageOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    if (
      !args[i]?.startsWith("--") ||
      !(OPTIONS.includes(key) || key === "platform") ||
      key in options ||
      !args[i + 1]
    )
      fail();
    options[key] = args[i + 1];
  }
  validateOptions(options);
  return options;
}

function validateOptions(options) {
  if (
    !options ||
    Object.keys(options).some(
      (key) => !(OPTIONS.includes(key) || key === "platform"),
    )
  )
    fail();
  if ("platform" in options && !PLATFORMS.includes(options.platform)) fail();
  for (const key of OPTIONS) {
    if (typeof options[key] !== "string") fail();
    if (
      key.endsWith("sha256")
        ? !/^[0-9a-f]{64}$/.test(options[key])
        : !isAbsolute(options[key])
    )
      fail();
  }
}

export async function checkedFile(path, expected, limit) {
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size < 1 ||
    stat.size > limit ||
    (await realpath(path)) !== resolve(path)
  )
    fail();
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const current = await handle.stat();
    if (!current.isFile() || current.size !== stat.size) fail();
    // Bounded even if another local process grows the source after stat.
    const buffer = Buffer.alloc(stat.size + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        size,
        buffer.length - size,
        size,
      );
      if (bytesRead === 0) break;
      size += bytesRead;
    }
    const bytes = buffer.subarray(0, size);
    if (size !== stat.size || hash(bytes) !== expected) fail();
    return bytes;
  } finally {
    await handle.close();
  }
}

// Explicit local packaging only. The runtime admission independently checks the actual ELF files.
export async function packageCodec(options) {
  let reserved = false;
  try {
    validateOptions(options);
    const files = {
      "libwebp.so.7": await checkedFile(
        options.webp,
        options["webp-sha256"],
        MAX_LIBRARY_BYTES,
      ),
      "libsharpyuv.so.0": await checkedFile(
        options.sharp,
        options["sharp-sha256"],
        MAX_LIBRARY_BYTES,
      ),
      COPYING: await checkedFile(
        options.copying,
        LICENSE_HASHES.COPYING,
        65536,
      ),
      PATENTS: await checkedFile(
        options.patents,
        LICENSE_HASHES.PATENTS,
        65536,
      ),
    };
    const destination = resolve(options.destination);
    if ((await realpath(dirname(destination))) !== dirname(destination)) fail();
    await mkdir(destination, { mode: 0o700 });
    reserved = true;
    const metadata = {
      format: "toonlira-native-codec-1",
      version: "1.6.0",
      platform: options.platform ?? "linux-aarch64-musl",
      "source.sha256": SOURCE_HASH,
      "webp.sha256": options["webp-sha256"],
      "sharp.sha256": options["sharp-sha256"],
      "copying.sha256": LICENSE_HASHES.COPYING,
      "patents.sha256": LICENSE_HASHES.PATENTS,
    };
    const manifest = Buffer.from(
      Object.entries(metadata)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(""),
      "ascii",
    );
    files["manifest.properties"] = manifest;
    for (const [name, bytes] of Object.entries(files)) {
      const output = join(destination, name);
      await writeFile(output, bytes, { flag: "wx", mode: 0o400 });
      await chmod(output, 0o444);
    }
    await chmod(destination, 0o555);
    return {
      manifestSha256: hash(manifest),
      files: Object.keys(files),
      status: "packaged-not-admitted",
    };
  } catch {
    // Never overwrite, resume or erase a partial reservation. Operator may recover the exact directory.
    throw new Error(
      reserved ? "render-package-incomplete" : "render-package-unavailable",
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    process.stdout.write(
      `${JSON.stringify(await packageCodec(parsePackageOptions(process.argv.slice(2))))}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
