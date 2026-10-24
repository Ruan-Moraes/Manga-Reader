import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifySingleJreProof } from "./single-jre-proof.mjs";
import { FILTER_PATTERNS } from "./single-jre-policy.mjs";
import { packageCodec } from "./render-native-package.mjs";
import { member, archive } from "./test-support/rootfs-archive-fixture.mjs";
import {
  prepareImageContext,
  prepareSingleJreImageContext,
} from "./render-native-image.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function fixture(t, architecture = "arm64") {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "single-jre-proof-test-")),
  );
  t.after(async () => {
    for (const dir of [
      "codec",
      "context/native",
      "context",
      "context-repeat/native",
      "context-repeat",
    ])
      await chmod(join(root, dir), 0o700).catch(() => {});
    await rm(root, { recursive: true, force: true });
  });
  const home = `/usr/lib/jvm/java-25-openjdk-${architecture}`;
  const kept = [
    home.slice(1) + "/bin/java",
    "etc/ssl/certs/java/cacerts",
    "var/lib/dpkg/status",
  ];
  const removed = "opt/java/openjdk/bin/java";
  const archived = (name) => member(name, { bytes: Buffer.from("file") });
  const originalArchive = archive([...kept, removed].map(archived));
  const filteredArchive = archive(kept.map(archived));
  const line = (name) =>
    `./${name} type=file uid=0 gid=0 mode=444 size=4 sha256digest=${sha("file")} time=1.0`;
  const proof = {
    format: "local-single-jre-base-1",
    architecture,
    sourceImage: "sha256:" + "b".repeat(64),
    sourceProofSha256: "c".repeat(64),
    imageId: "sha256:" + "d".repeat(64),
    sourceRootfsBytes: originalArchive.length,
    rootfsBytes: filteredArchive.length,
    sourceRootfsSha256: sha(originalArchive),
    rootfsSha256: sha(filteredArchive),
    exclusions: [...FILTER_PATTERNS],
    entryProof: { retained: 3, removed: 1 },
    contentProof: { retained: 3, removed: 1 },
    installedPackagesUnchanged: true,
    ubuntuJreUnchanged: true,
    originalImagesPreserved: true,
    layerCount: 1,
    javaHome: home,
    status: "experimental-not-operational",
    securityApproved: false,
    artifacts: {},
  };
  const values = {
    "entries-before.out": [...kept, removed].join("\n") + "\n",
    "entries-after.out": kept.join("\n") + "\n",
    "mtree-before.out": [...kept, removed].map(line).join("\n") + "\n",
    "mtree-after.out": kept.map(line).join("\n") + "\n",
    "verbose-before.out": "",
    "verbose-after.out": "",
    "target-inspect.out": JSON.stringify([
      {
        Id: proof.imageId,
        Architecture: architecture,
        Os: "linux",
        RootFS: { Type: "layers", Layers: ["sha256:" + proof.rootfsSha256] },
        Config: {
          Env: ["JAVA_HOME=" + home, "PATH=" + home + "/bin:/usr/bin:/bin"],
          Entrypoint: [home + "/bin/java"],
          Cmd: ["-version"],
          Labels: {
            "com.toonlira.runtime.candidate": "ubuntu-single-jre-local-only",
            "com.toonlira.runtime.source": proof.sourceImage,
            "com.toonlira.runtime.proof": proof.sourceProofSha256,
          },
        },
      },
    ]),
  };
  for (const [name, bytes] of Object.entries(values)) {
    await writeFile(join(root, name), bytes, { mode: 0o444 });
    proof.artifacts[name] = sha(bytes);
  }
  await writeFile(join(root, "source-rootfs.tar"), originalArchive, {
    mode: 0o444,
  });
  await writeFile(join(root, "single-rootfs.tar"), filteredArchive, {
    mode: 0o444,
  });
  const path = join(root, "result.json");
  async function seal() {
    await chmod(path, 0o600).catch(() => {});
    const bytes = JSON.stringify(proof);
    await writeFile(path, bytes, { mode: 0o444 });
    await chmod(path, 0o444);
    return {
      path,
      sha256: sha(bytes),
      platform:
        architecture === "arm64" ? "linux-aarch64-glibc" : "linux-x86_64-glibc",
    };
  }
  return { root, proof, seal, options: await seal() };
}
for (const architecture of ["arm64", "amd64"]) {
  test(`verifies sealed synthetic records for ${architecture}, never claims operational admission`, async (t) => {
    const { root, proof, options } = await fixture(t, architecture);
    const result = await verifySingleJreProof(options);
    assert.equal(result.baseImage, proof.imageId);
    assert.equal(result.baseSecurityApproved, false);
    assert.equal(result.baseOperationalApproved, false);
    assert.equal(result.baseProofSha256, options.sha256);
    assert.equal(result.baseMetadataAudit, "xattrs-acls-capabilities-pending");
    assert.ok(!JSON.stringify(result).includes(root));
  });
}
test("rejects absent seals, mismatched architecture, writable/symlinked and adulterated input", async (t) => {
  const { root, options } = await fixture(t);
  for (const invalid of [
    { ...options, sha256: null },
    { ...options, sha256: "0".repeat(64) },
    { ...options, platform: "linux-x86_64-glibc" },
    { ...options, path: "relative" },
  ])
    await assert.rejects(verifySingleJreProof(invalid), {
      message: "single-jre-proof-unavailable",
    });
  const tar = join(root, "single-rootfs.tar");
  await chmod(tar, 0o600);
  await assert.rejects(verifySingleJreProof(options));
  await writeFile(tar, "fake");
  await chmod(tar, 0o444);
  await assert.rejects(verifySingleJreProof(options));
  await rm(tar);
  await symlink(join(root, "source-rootfs.tar"), tar);
  await assert.rejects(verifySingleJreProof(options));
});
test("rejects unknown policy, security promotion, missing/unsafe artifacts and inconsistent counts", async (t) => {
  const { proof, seal } = await fixture(t);
  const initial = structuredClone(proof);
  for (const change of [
    (p) => (p.securityApproved = true),
    (p) => (p.status = "approved"),
    (p) => p.exclusions.push("^usr/?*"),
    (p) => p.entryProof.retained++,
    (p) => delete p.artifacts["mtree-after.out"],
    (p) => (p.artifacts["../secret"] = "a".repeat(64)),
    (p) => (p.rootfsBytes = 3),
    (p) => (p.javaHome = "/opt/java/openjdk"),
    (p) => (p.layerCount = 2),
  ]) {
    Object.assign(proof, structuredClone(initial));
    change(proof);
    await assert.rejects(verifySingleJreProof(await seal()), {
      message: "single-jre-proof-unavailable",
    });
  }
});
test("recomputes records and checks target layer/config rather than trusting success booleans", async (t) => {
  const { root, proof, seal } = await fixture(t);
  const name = "target-inspect.out";
  const original = JSON.parse(await readFile(join(root, name), "utf8"));
  for (const mutate of [
    (p) => p.RootFS.Layers.push("sha256:" + "f".repeat(64)),
    (p) => (p.RootFS.Layers[0] = "sha256:" + "f".repeat(64)),
    (p) => p.Config.Env.push("OTHER=/opt/java/openjdk"),
    (p) => (p.Config.Entrypoint = ["/bin/sh"]),
    (p) => (p.Config.Volumes = { "/app": {} }),
  ]) {
    const next = structuredClone(original);
    mutate(next[0]);
    const bytes = JSON.stringify(next);
    await chmod(join(root, name), 0o600);
    await writeFile(join(root, name), bytes);
    await chmod(join(root, name), 0o444);
    proof.artifacts[name] = sha(bytes);
    await assert.rejects(verifySingleJreProof(await seal()));
  }
  const originalBytes = JSON.stringify(original);
  await chmod(join(root, name), 0o600);
  await writeFile(join(root, name), originalBytes);
  await chmod(join(root, name), 0o444);
  proof.artifacts[name] = sha(originalBytes);
  const record = "mtree-after.out";
  await chmod(join(root, record), 0o600);
  const bytes = (await readFile(join(root, record), "utf8")).replace(
    "mode=444",
    "mode=666",
  );
  await writeFile(join(root, record), bytes);
  await chmod(join(root, record), 0o444);
  proof.artifacts[record] = sha(bytes);
  await assert.rejects(verifySingleJreProof(await seal()));
  assert.equal(
    (await lstat(join(root, "single-rootfs.tar"))).size,
    proof.rootfsBytes,
  );
});
test("captured listings cannot hide a changed retained payload in the actual archives", async (t) => {
  const { root, proof, seal } = await fixture(t);
  const path = join(root, "source-rootfs.tar"),
    bytes = await readFile(path);
  Buffer.from("evil").copy(bytes, 512);
  await chmod(path, 0o600);
  await writeFile(path, bytes);
  await chmod(path, 0o444);
  proof.sourceRootfsSha256 = sha(bytes);
  await assert.rejects(verifySingleJreProof(await seal()), {
    message: "single-jre-proof-unavailable",
  });
});
for (const arch of ["arm64", "amd64"]) {
  test(`separate context path for ${arch} preserves defaults, rejects replay and copies no proof paths`, async (t) => {
    const { root, options, proof } = await fixture(t, arch);
    const webp = join(root, "webp"),
      sharp = join(root, "sharp");
    await writeFile(webp, "webp");
    await writeFile(sharp, "sharp");
    for (const name of ["COPYING", "PATENTS"])
      await writeFile(
        join(root, name),
        await readFile(
          new URL(
            `../src/test/resources/rendering-native-license/${name}`,
            import.meta.url,
          ),
        ),
      );
    const codec = await packageCodec({
      webp,
      sharp,
      copying: join(root, "COPYING"),
      patents: join(root, "PATENTS"),
      destination: join(root, "codec"),
      platform: options.platform,
      "webp-sha256": sha("webp"),
      "sharp-sha256": sha("sharp"),
    });
    const jar = join(root, "gateway.jar");
    await writeFile(jar, "synthetic-not-admitted-jar");
    const context = {
      jar,
      "jar-sha256": sha("synthetic-not-admitted-jar"),
      distribution: join(root, "codec"),
      "manifest-sha256": codec.manifestSha256,
      platform: options.platform,
      destination: join(root, "context"),
      "base-proof": options.path,
      "base-proof-sha256": options.sha256,
    };
    await assert.rejects(
      prepareImageContext(context),
      /native-image-unavailable/,
    );
    const noProof = { ...context };
    delete noProof["base-proof"];
    delete noProof["base-proof-sha256"];
    await assert.rejects(
      prepareSingleJreImageContext(noProof),
      /native-image-unavailable/,
    );
    const result = await prepareSingleJreImageContext(context);
    assert.equal(result.baseImage, proof.imageId);
    assert.equal(result.javaVersion, "25.0.4.1+1-1-24.04.4-Ubuntu");
    assert.equal(result.status, "prepared-not-built");
    assert.equal(result.baseSecurityApproved, false);
    assert.equal(result.baseOperationalApproved, false);
    const metadata = await readFile(
      join(context.destination, "image-inputs.json"),
      "utf8",
    );
    assert.ok(!metadata.includes(root));
    const dockerfile = await readFile(
      join(context.destination, "Dockerfile"),
      "utf8",
    );
    assert.ok(dockerfile.includes("GATEWAY_ENABLED=false"));
    assert.ok(dockerfile.includes("USER 1000:1000"));
    assert.deepEqual(result.buildArguments, {
      RUNTIME_IMAGE: proof.imageId,
      CODEC_MANIFEST_SHA256: codec.manifestSha256,
      GATEWAY_JAR_SHA256: context["jar-sha256"],
    });
    const repeated = await prepareSingleJreImageContext({
      ...context,
      destination: join(root, "context-repeat"),
    });
    assert.equal(repeated.contextSha256, result.contextSha256);
    await assert.rejects(
      prepareSingleJreImageContext(context),
      /native-image-incomplete|native-image-unavailable/,
    );
  });
}
