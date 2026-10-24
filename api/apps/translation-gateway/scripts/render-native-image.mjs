import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  checkedFile,
  LICENSE_HASHES,
  MAX_LIBRARY_BYTES,
  SOURCE_HASH,
} from "./render-native-package.mjs";
import { UPDATES } from "./ubuntu-base-update.mjs";
import { verifySingleJreProof } from "./single-jre-proof.mjs";

const MAX_JAR_BYTES = 512 * 1024 * 1024;
const OPTIONS = [
  "jar",
  "jar-sha256",
  "distribution",
  "manifest-sha256",
  "platform",
  "destination",
];
const OPTIONAL_BASE_OPTIONS = ["base-proof", "base-proof-sha256"];
const PACKAGE_FILES = [
  "libwebp.so.7",
  "libsharpyuv.so.0",
  "COPYING",
  "PATENTS",
  "manifest.properties",
];
const TARGETS = Object.freeze({
  "linux-aarch64-glibc": {
    dockerPlatform: "linux/arm64",
    baseImage:
      "eclipse-temurin@sha256:c31e783e090e5bcf4ddee2bfbce5bf78b5d832daae66767cb9a2315b8d4802b5",
  },
  "linux-x86_64-glibc": {
    dockerPlatform: "linux/amd64",
    baseImage:
      "eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a",
  },
});
const fail = (reserved = false) => {
  throw new Error(
    reserved ? "native-image-incomplete" : "native-image-unavailable",
  );
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function parseImageOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    if (
      !args[i]?.startsWith("--") ||
      ![...OPTIONS, ...OPTIONAL_BASE_OPTIONS].includes(key) ||
      key in options ||
      !args[i + 1]
    )
      fail();
    options[key] = args[i + 1];
  }
  validate(options);
  return options;
}
function validate(options) {
  if (
    !options ||
    ![OPTIONS.length, OPTIONS.length + OPTIONAL_BASE_OPTIONS.length].includes(
      Object.keys(options).length,
    ) ||
    OPTIONAL_BASE_OPTIONS.some(
      (key) => key in options !== "base-proof" in options,
    ) ||
    !Object.hasOwn(TARGETS, options.platform)
  )
    fail();
  for (const key of [
    ...OPTIONS,
    ...OPTIONAL_BASE_OPTIONS.filter((key) => key in options),
  ]) {
    if (typeof options[key] !== "string") fail();
    if (key === "platform") continue;
    if (
      key.endsWith("sha256")
        ? !/^[0-9a-f]{64}$/.test(options[key])
        : !isAbsolute(options[key]) || resolve(options[key]) !== options[key]
    )
      fail();
  }
  if (
    Object.keys(options).some(
      (key) => ![...OPTIONS, ...OPTIONAL_BASE_OPTIONS].includes(key),
    )
  )
    fail();
}

async function runtimeBase(options) {
  const target = TARGETS[options.platform];
  if (!("base-proof" in options)) return target;
  await readonly(options["base-proof"]);
  const bytes = await checkedFile(
    options["base-proof"],
    options["base-proof-sha256"],
    65536,
  );
  const proof = JSON.parse(bytes.toString("utf8"));
  const architecture = target.dockerPlatform.split("/")[1];
  if (
    proof.format !== "toonlira-local-base-update-1" ||
    proof.base !== target.baseImage ||
    proof.architecture !== architecture ||
    proof.status !== "local-only-not-security-approved" ||
    !/^sha256:[0-9a-f]{64}$/.test(proof.imageId ?? "") ||
    !/^[0-9a-f]{64}$/.test(proof.jreInventorySha256 ?? "") ||
    !Array.isArray(proof.packages) ||
    proof.packages.length !== 2 ||
    !Array.isArray(proof.changes) ||
    proof.changes.length !== 2
  )
    fail();
  for (const [name, versions] of Object.entries(UPDATES)) {
    const packages = proof.packages.filter((item) => item?.name === name);
    const changes = proof.changes.filter(
      (item) => item?.package === `${name}:${architecture}`,
    );
    if (
      packages.length !== 1 ||
      packages[0].version !== versions.after ||
      packages[0].architecture !== architecture ||
      !/^[0-9a-f]{64}$/.test(packages[0].sha256 ?? "") ||
      changes.length !== 1 ||
      changes[0].before !== versions.before ||
      changes[0].after !== versions.after
    )
      fail();
  }
  return {
    dockerPlatform: target.dockerPlatform,
    baseImage: proof.imageId,
    baseParentImage: target.baseImage,
    baseProofSha256: options["base-proof-sha256"],
    baseSecurityApproved: false,
  };
}
async function readonly(path) {
  if ((await lstat(path)).mode & 0o222) fail();
}
async function packageSnapshot(options) {
  const root = options.distribution;
  if ((await realpath(root)) !== root || !(await lstat(root)).isDirectory())
    fail();
  await readonly(root);
  if (
    JSON.stringify((await readdir(root)).sort()) !==
    JSON.stringify([...PACKAGE_FILES].sort())
  )
    fail();
  const manifest = await checkedFile(
    join(root, "manifest.properties"),
    options["manifest-sha256"],
    4096,
  );
  const values = new Map();
  const lines = manifest.toString("ascii").split("\n");
  if (
    lines.length !== 9 ||
    lines.at(-1) !== "" ||
    ![...manifest].every((byte) => byte === 10 || (byte >= 32 && byte <= 126))
  )
    fail();
  for (const line of lines.slice(0, -1)) {
    const parts = line.split("=");
    if (parts.length !== 2 || values.has(parts[0]) || !parts[1]) fail();
    values.set(...parts);
  }
  const expected = {
    format: "toonlira-native-codec-1",
    version: "1.6.0",
    platform: options.platform,
    "source.sha256": SOURCE_HASH,
    "copying.sha256": LICENSE_HASHES.COPYING,
    "patents.sha256": LICENSE_HASHES.PATENTS,
  };
  if (
    values.size !== 8 ||
    [...values.keys()].some(
      (key) =>
        !Object.hasOwn(expected, key) &&
        key !== "webp.sha256" &&
        key !== "sharp.sha256",
    )
  )
    fail();
  for (const [key, value] of Object.entries(expected))
    if (values.get(key) !== value) fail();
  const files = { "manifest.properties": manifest };
  for (const name of PACKAGE_FILES) {
    const path = join(root, name);
    await readonly(path);
    if (name === "manifest.properties") continue;
    const hash =
      name === "libwebp.so.7"
        ? values.get("webp.sha256")
        : name === "libsharpyuv.so.0"
          ? values.get("sharp.sha256")
          : LICENSE_HASHES[name];
    files[name] = await checkedFile(
      path,
      hash,
      name.startsWith("lib") ? MAX_LIBRARY_BYTES : 65536,
    );
  }
  return files;
}
async function archiveHandle(path) {
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size < 1 ||
    stat.size > MAX_JAR_BYTES ||
    (await realpath(path)) !== path
  )
    fail();
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (
      !(await handle.stat()).isFile() ||
      (await handle.stat()).size !== stat.size
    )
      fail();
    return { handle, size: stat.size };
  } catch (error) {
    await handle.close();
    throw error;
  }
}
async function streamArchive(handle, size, expected, output) {
  const digest = createHash("sha256");
  const buffer = Buffer.alloc(65536);
  let position = 0;
  while (position <= size) {
    const { bytesRead } = await handle.read(
      buffer,
      0,
      Math.min(buffer.length, size + 1 - position),
      position,
    );
    if (!bytesRead) break;
    position += bytesRead;
    if (position > size) fail();
    digest.update(buffer.subarray(0, bytesRead));
    if (output) {
      let written = 0;
      while (written < bytesRead) {
        const next = await output.write(buffer, written, bytesRead - written);
        if (!next.bytesWritten) fail();
        written += next.bytesWritten;
      }
    }
  }
  if (position !== size || digest.digest("hex") !== expected) fail();
}

/** Snapshot only: never invokes Docker, downloads dependencies, pushes an image, opens ADC or starts a provider. */
export async function prepareImageContext(options) {
  return prepareContext(options, runtimeBase);
}

/** Explicit experimental route; never widens the default two-patch proof contract. */
export async function prepareSingleJreImageContext(options) {
  const prepared = await prepareContext(options, async (validated) => {
    if (!("base-proof" in validated)) fail();
    return verifySingleJreProof({
      path: validated["base-proof"],
      sha256: validated["base-proof-sha256"],
      platform: validated.platform,
    });
  });
  return {
    ...prepared,
    buildArguments: {
      RUNTIME_IMAGE: prepared.baseImage,
      CODEC_MANIFEST_SHA256: prepared.manifestSha256,
      GATEWAY_JAR_SHA256: prepared.jarSha256,
    },
  };
}

async function prepareContext(options, resolveBase) {
  let reserved = false,
    archive,
    output;
  try {
    validate(options);
    const base = await resolveBase(options);
    const files = await packageSnapshot(options);
    archive = await archiveHandle(options.jar);
    await streamArchive(archive.handle, archive.size, options["jar-sha256"]);
    const destination = options.destination;
    if ((await realpath(dirname(destination))) !== dirname(destination)) fail();
    const dockerfile = await readFile(
      new URL("../Dockerfile.native", import.meta.url),
    );
    await mkdir(destination, { mode: 0o700 });
    reserved = true;
    await mkdir(join(destination, "native"), { mode: 0o700 });
    const hashes = {};
    for (const [name, bytes] of Object.entries(files)) {
      await writeFile(join(destination, "native", name), bytes, {
        flag: "wx",
        mode: 0o444,
      });
      await chmod(join(destination, "native", name), 0o444);
      hashes[`native/${name}`] = sha(bytes);
    }
    await chmod(join(destination, "native"), 0o555);
    output = await open(join(destination, "gateway.jar"), "wx", 0o400);
    await streamArchive(
      archive.handle,
      archive.size,
      options["jar-sha256"],
      output,
    );
    await output.close();
    output = null;
    await chmod(join(destination, "gateway.jar"), 0o444);
    hashes["gateway.jar"] = options["jar-sha256"];
    const metadata = {
      format: "toonlira-native-image-1",
      platform: options.platform,
      ...base,
      runtimeMajor: 25,
      javaVersion: base.javaVersion ?? "25.0.4.1+1",
      jarSha256: options["jar-sha256"],
      jarBytes: archive.size,
      manifestSha256: options["manifest-sha256"],
    };
    const metadataBytes = Buffer.from(JSON.stringify(metadata, null, 2) + "\n");
    const ignore = Buffer.from(
      "*\n!Dockerfile\n!.dockerignore\n!gateway.jar\n!image-inputs.json\n!native/\n" +
        PACKAGE_FILES.map((name) => `!native/${name}\n`).join(""),
    );
    for (const [name, bytes] of Object.entries({
      Dockerfile: dockerfile,
      "image-inputs.json": metadataBytes,
      ".dockerignore": ignore,
    })) {
      await writeFile(join(destination, name), bytes, {
        flag: "wx",
        mode: 0o444,
      });
      hashes[name] = sha(bytes);
    }
    const digest = createHash("sha256");
    for (const name of Object.keys(hashes).sort())
      digest.update(name).update("\0").update(hashes[name]).update("\0");
    return {
      ...metadata,
      contextSha256: digest.digest("hex"),
      files: Object.keys(hashes).sort(),
      status: "prepared-not-built",
    };
  } catch {
    fail(reserved);
  } finally {
    await output?.close().catch(() => {});
    await archive?.handle.close().catch(() => {});
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    process.stdout.write(
      JSON.stringify(
        await prepareImageContext(parseImageOptions(process.argv.slice(2))),
      ) + "\n",
    );
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
