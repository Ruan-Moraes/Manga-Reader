import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { FILTER_PATTERNS, verifyRootfsRecords } from "./single-jre-policy.mjs";
import { auditRootfsArchives } from "./rootfs-archive-audit.mjs";

const HASH = /^[a-f0-9]{64}$/;
const IMAGE = /^sha256:[a-f0-9]{64}$/;
const MAX_RECORD_BYTES = 32 * 1024 * 1024;
const ARCHITECTURES = Object.freeze({
  "linux-aarch64-glibc": "arm64",
  "linux-x86_64-glibc": "amd64",
});
const RECORDS = Object.freeze({
  beforeEntries: "entries-before.out",
  afterEntries: "entries-after.out",
  beforeMtree: "mtree-before.out",
  afterMtree: "mtree-after.out",
  beforeVerbose: "verbose-before.out",
  afterVerbose: "verbose-after.out",
});
const fail = () => {
  throw new Error("single-jre-proof-unavailable");
};

// Streams rootfs inputs; retains only bounded small records. Never extracts or executes an archive.
async function sealedFile(
  path,
  expected,
  limit,
  collect = false,
  expectedSize,
) {
  if (!isAbsolute(path) || resolve(path) !== path || !HASH.test(expected))
    fail();
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.mode & 0o222 ||
    stat.size > limit ||
    (await realpath(path)) !== path ||
    (expectedSize !== undefined && stat.size !== expectedSize)
  )
    fail();
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const current = await handle.stat();
    if (
      current.size !== stat.size ||
      current.ino !== stat.ino ||
      current.dev !== stat.dev ||
      current.mode & 0o222
    )
      fail();
    const hash = createHash("sha256"),
      buffer = Buffer.alloc(65536),
      chunks = [];
    let position = 0;
    for (;;) {
      const { bytesRead } = await handle.read(
        buffer,
        0,
        Math.min(buffer.length, stat.size + 1 - position),
        position,
      );
      if (!bytesRead) break;
      position += bytesRead;
      if (position > stat.size) fail();
      hash.update(buffer.subarray(0, bytesRead));
      if (collect) chunks.push(Buffer.from(buffer.subarray(0, bytesRead)));
    }
    if (position !== stat.size || hash.digest("hex") !== expected) fail();
    return collect ? Buffer.concat(chunks) : undefined;
  } finally {
    await handle.close();
  }
}
function matchingCounts(value, expected) {
  return (
    value &&
    Object.keys(value).length === 2 &&
    value.retained === expected.retained &&
    value.removed === expected.removed
  );
}

/** Rechecks a caller-pinned local receipt. A hash is integrity, not authorship or security approval. */
export async function verifySingleJreProof(options) {
  try {
    if (
      !options ||
      Object.keys(options).sort().join(",") !== "path,platform,sha256" ||
      typeof options.path !== "string" ||
      !Object.hasOwn(ARCHITECTURES, options.platform) ||
      typeof options.sha256 !== "string" ||
      !HASH.test(options.sha256)
    )
      fail();
    const proof = JSON.parse(
      (await sealedFile(options.path, options.sha256, 65536, true)).toString(
        "utf8",
      ),
    );
    const arch = ARCHITECTURES[options.platform],
      home = `/usr/lib/jvm/java-25-openjdk-${arch}`;
    if (
      proof.format !== "local-single-jre-base-1" ||
      proof.architecture !== arch ||
      !IMAGE.test(proof.imageId) ||
      !IMAGE.test(proof.sourceImage) ||
      !HASH.test(proof.sourceProofSha256) ||
      proof.imageId === proof.sourceImage ||
      proof.status !== "experimental-not-operational" ||
      proof.securityApproved !== false ||
      proof.layerCount !== 1 ||
      proof.javaHome !== home ||
      proof.installedPackagesUnchanged !== true ||
      proof.ubuntuJreUnchanged !== true ||
      proof.originalImagesPreserved !== true ||
      JSON.stringify(proof.exclusions) !== JSON.stringify(FILTER_PATTERNS) ||
      !Number.isSafeInteger(proof.rootfsBytes) ||
      proof.rootfsBytes < 1 ||
      !Number.isSafeInteger(proof.sourceRootfsBytes) ||
      proof.sourceRootfsBytes <= proof.rootfsBytes ||
      !proof.artifacts ||
      typeof proof.artifacts !== "object" ||
      Array.isArray(proof.artifacts) ||
      Object.keys(proof.artifacts).length < 7 ||
      Object.keys(proof.artifacts).length > 96
    )
      fail();
    const root = dirname(options.path),
      records = {};
    for (const [name, hash] of Object.entries(proof.artifacts)) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_.+-]{0,127}$/.test(name) || !HASH.test(hash))
        fail();
      const collect =
        Object.values(RECORDS).includes(name) || name === "target-inspect.out";
      const bytes = await sealedFile(
        join(root, name),
        hash,
        MAX_RECORD_BYTES,
        collect,
      );
      if (collect)
        records[name] = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    const inputs = {};
    for (const [field, name] of Object.entries(RECORDS)) {
      if (!Object.hasOwn(records, name)) fail();
      inputs[field] = records[name];
    }
    const verified = verifyRootfsRecords(inputs, arch);
    if (
      !matchingCounts(proof.entryProof, verified.entryProof) ||
      !matchingCounts(proof.contentProof, verified.contentProof)
    )
      fail();
    const archiveAudit = await auditRootfsArchives({
      before: join(root, "source-rootfs.tar"),
      beforeSha256: proof.sourceRootfsSha256,
      after: join(root, "single-rootfs.tar"),
      afterSha256: proof.rootfsSha256,
      architecture: arch,
    });
    if (
      archiveAudit.before.bytes !== proof.sourceRootfsBytes ||
      archiveAudit.after.bytes !== proof.rootfsBytes ||
      archiveAudit.retained !== verified.entryProof.retained ||
      archiveAudit.removed !== verified.entryProof.removed
    )
      fail();
    const inspected = JSON.parse(records["target-inspect.out"]);
    if (!Array.isArray(inspected) || inspected.length !== 1) fail();
    const target = inspected[0],
      config = target.Config;
    if (
      target.Id !== proof.imageId ||
      target.Architecture !== arch ||
      target.Os !== "linux" ||
      target.RootFS?.Type !== "layers" ||
      JSON.stringify(target.RootFS.Layers) !==
        JSON.stringify(["sha256:" + proof.rootfsSha256]) ||
      !config ||
      !Array.isArray(config.Env) ||
      config.Env.some(
        (value) =>
          typeof value !== "string" || value.includes("/opt/java/openjdk"),
      ) ||
      config.Env.filter((value) => value.startsWith("JAVA_HOME=")).join() !==
        "JAVA_HOME=" + home ||
      config.Env.filter((value) => value.startsWith("PATH=")).length !== 1 ||
      !config.Env.some((value) => value.startsWith("PATH=" + home + "/bin:")) ||
      JSON.stringify(config.Entrypoint) !==
        JSON.stringify([home + "/bin/java"]) ||
      JSON.stringify(config.Cmd) !== '["-version"]' ||
      (config.Volumes && Object.keys(config.Volumes).length) ||
      config.Labels?.["com.toonlira.runtime.candidate"] !==
        "ubuntu-single-jre-local-only" ||
      config.Labels?.["com.toonlira.runtime.source"] !== proof.sourceImage ||
      config.Labels?.["com.toonlira.runtime.proof"] !== proof.sourceProofSha256
    )
      fail();
    return {
      dockerPlatform: "linux/" + arch,
      baseImage: proof.imageId,
      baseParentImage: proof.sourceImage,
      baseProofSha256: options.sha256,
      baseRootfsSha256: proof.rootfsSha256,
      baseSecurityApproved: false,
      baseOperationalApproved: false,
      baseProofVerification: "captured-records-and-archive-headers-content",
      baseMetadataAudit: "xattrs-acls-capabilities-pending",
      runtimeVendor: "Ubuntu",
      javaVersion: "25.0.4.1+1-1-24.04.4-Ubuntu",
    };
  } catch {
    fail();
  }
}
