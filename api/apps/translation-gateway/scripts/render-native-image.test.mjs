import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { packageCodec } from "./render-native-package.mjs";
import {
  prepareImageContext,
  parseImageOptions,
} from "./render-native-image.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function fixture(platform = "linux-aarch64-glibc") {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "native-image-test-")),
  );
  const packageOptions = {
    destination: join(root, "codec"),
    webp: join(root, "webp"),
    sharp: join(root, "sharp"),
    copying: join(root, "COPYING"),
    patents: join(root, "PATENTS"),
    "webp-sha256": sha("webp"),
    "sharp-sha256": sha("sharp"),
    platform,
  };
  await writeFile(packageOptions.webp, "webp");
  await writeFile(packageOptions.sharp, "sharp");
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
  const packaged = await packageCodec(packageOptions);
  const jar = join(root, "gateway.jar");
  await writeFile(jar, "synthetic-archive-not-runtime-admitted");
  return {
    root,
    options: {
      jar,
      "jar-sha256": sha(await readFile(jar)),
      distribution: packageOptions.destination,
      "manifest-sha256": packaged.manifestSha256,
      platform,
      destination: join(root, "context"),
    },
  };
}
async function cleanup(root) {
  for (const dir of ["codec", "context", "context/native"])
    await chmod(join(root, dir), 0o700).catch(() => {});
  await rm(root, { recursive: true, force: true });
}

test("requires explicit glibc target/pins, rejects aliases, duplicate options, download/push/credentials", () => {
  for (const args of [
    [],
    ["--download", "true"],
    ["--push", "true"],
    ["--credentials", "/private"],
  ])
    assert.throws(() => parseImageOptions(args), /native-image-unavailable/);
});

test("derived local base needs an explicit hash-pinned matching preparation proof", async () => {
  const { root, options } = await fixture();
  const proofPath = join(root, "base-proof.json");
  const proof = {
    format: "toonlira-local-base-update-1",
    base: "eclipse-temurin@sha256:c31e783e090e5bcf4ddee2bfbce5bf78b5d832daae66767cb9a2315b8d4802b5",
    architecture: "arm64",
    imageId: "sha256:" + "a".repeat(64),
    status: "local-only-not-security-approved",
    jreInventorySha256: "b".repeat(64),
    packages: [
      {
        name: "libfreetype6",
        version: "2.13.2+dfsg-1ubuntu0.2",
        architecture: "arm64",
        sha256: "c".repeat(64),
      },
      {
        name: "libpng16-16t64",
        version: "1.6.43-5ubuntu0.7",
        architecture: "arm64",
        sha256: "d".repeat(64),
      },
    ],
    changes: [
      {
        package: "libfreetype6:arm64",
        before: "2.13.2+dfsg-1ubuntu0.1",
        after: "2.13.2+dfsg-1ubuntu0.2",
      },
      {
        package: "libpng16-16t64:arm64",
        before: "1.6.43-5ubuntu0.6",
        after: "1.6.43-5ubuntu0.7",
      },
    ],
  };
  try {
    await writeFile(proofPath, JSON.stringify(proof), { mode: 0o444 });
    const augmented = {
      ...options,
      "base-proof": proofPath,
      "base-proof-sha256": sha(await readFile(proofPath)),
    };
    for (const invalid of [
      { ...augmented, "base-proof-sha256": "0".repeat(64) },
      { ...options, "base-proof": proofPath },
      { ...augmented, platform: "linux-x86_64-glibc" },
    ])
      await assert.rejects(prepareImageContext(invalid));
    const result = await prepareImageContext(augmented);
    assert.equal(result.baseImage, proof.imageId);
    assert.equal(result.baseParentImage, proof.base);
    assert.equal(result.baseSecurityApproved, false);
    assert.equal(result.baseProofSha256, augmented["base-proof-sha256"]);
    const metadata = await readFile(
      join(options.destination, "image-inputs.json"),
      "utf8",
    );
    assert.ok(!metadata.includes(root));
    assert.ok(!metadata.includes("jreInventory"));
    for (const invalidProof of [
      { ...proof, status: "security-approved" },
      { ...proof, imageId: "registry.example/runtime:latest" },
      { ...proof, base: "eclipse-temurin@sha256:" + "0".repeat(64) },
      { ...proof, jreInventorySha256: null },
      { ...proof, packages: [...proof.packages, proof.packages[0]] },
      { ...proof, changes: [] },
      { ...proof, packages: [proof.packages[0], proof.packages[0]] },
    ]) {
      const path = join(
        root,
        `invalid-${sha(JSON.stringify(invalidProof))}.json`,
      );
      await writeFile(path, JSON.stringify(invalidProof), { mode: 0o444 });
      await assert.rejects(
        prepareImageContext({
          ...options,
          destination: join(root, "never-created"),
          "base-proof": path,
          "base-proof-sha256": sha(await readFile(path)),
        }),
      );
      await assert.rejects(lstat(join(root, "never-created")), {
        code: "ENOENT",
      });
    }
  } finally {
    await cleanup(root);
  }
});
for (const platform of ["linux-aarch64-glibc", "linux-x86_64-glibc"]) {
  test(`creates exclusive bounded snapshot for ${platform}, no source paths/secrets or activation`, async () => {
    const { root, options } = await fixture(platform);
    try {
      await writeFile(join(root, "unrelated-secret"), "never-copy-me");
      const args = Object.entries(options).flatMap(([key, value]) => [
        `--${key}`,
        value,
      ]);
      const result = await prepareImageContext(parseImageOptions(args));
      assert.equal(result.status, "prepared-not-built");
      assert.match(result.baseImage, /^eclipse-temurin@sha256:[0-9a-f]{64}$/);
      assert.equal(result.platform, platform);
      assert.equal(result.runtimeMajor, 25);
      assert.equal(result.javaVersion, "25.0.4.1+1");
      assert.equal(
        result.baseImage,
        platform === "linux-aarch64-glibc"
          ? "eclipse-temurin@sha256:c31e783e090e5bcf4ddee2bfbce5bf78b5d832daae66767cb9a2315b8d4802b5"
          : "eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a",
      );
      assert.equal(result.files.length, 9);
      assert.deepEqual(
        (await readdir(options.destination)).sort(),
        [
          ".dockerignore",
          "Dockerfile",
          "gateway.jar",
          "image-inputs.json",
          "native",
        ].sort(),
      );
      const metadata = await readFile(
        join(options.destination, "image-inputs.json"),
        "utf8",
      );
      assert.ok(!metadata.includes(root));
      assert.ok(!metadata.includes("never-copy-me"));
      const dockerfile = await readFile(
        join(options.destination, "Dockerfile"),
        "utf8",
      );
      for (const setting of [
        "GATEWAY_ENABLED=false",
        "GATEWAY_OCR_MODE=disabled",
        "GATEWAY_TRANSLATION_MODE=disabled",
        "GATEWAY_RENDERING_MODE=disabled",
      ])
        assert.ok(dockerfile.includes(setting));
      assert.ok(dockerfile.includes("USER 1000:1000"));
      assert.ok(dockerfile.includes("NativeCodecImageAdmissionMain"));
      assert.ok(!dockerfile.includes("apt-get"));
      assert.ok(!dockerfile.includes("ADD http"));
      assert.equal(
        (await lstat(join(options.destination, "native"))).mode & 0o222,
        0,
      );
      assert.deepEqual(
        await readFile(join(options.destination, "gateway.jar")),
        await readFile(options.jar),
      );
      await assert.rejects(
        prepareImageContext(options),
        /native-image-unavailable/,
      );
    } finally {
      await cleanup(root);
    }
  });
}
test("wrong jar/package pin, cross-target package, writable package and symlink fail before reservation", async () => {
  const { root, options } = await fixture();
  try {
    for (const changed of [
      { "jar-sha256": "0".repeat(64) },
      { "manifest-sha256": "0".repeat(64) },
      { platform: "linux-x86_64-glibc" },
      { platform: "linux-aarch64-musl" },
    ]) {
      await assert.rejects(
        prepareImageContext({ ...options, ...changed }),
        /native-image-unavailable/,
      );
      await assert.rejects(lstat(options.destination), { code: "ENOENT" });
    }
    await symlink(options.jar, join(root, "jar-link"));
    await assert.rejects(
      prepareImageContext({ ...options, jar: join(root, "jar-link") }),
    );
    await chmod(options.distribution, 0o755);
    await assert.rejects(prepareImageContext(options));
    await assert.rejects(lstat(options.destination), { code: "ENOENT" });
  } finally {
    await cleanup(root);
  }
});
test("unknown files and concurrent preparations never copy unrelated data or overwrite a winner", async () => {
  const { root, options } = await fixture();
  try {
    await chmod(options.distribution, 0o755);
    await writeFile(join(options.distribution, "private"), "secret");
    await chmod(options.distribution, 0o555);
    await assert.rejects(prepareImageContext(options));
    await chmod(options.distribution, 0o755);
    await rm(join(options.distribution, "private"));
    await chmod(options.distribution, 0o555);
    const outcomes = await Promise.allSettled([
      prepareImageContext(options),
      prepareImageContext(options),
    ]);
    assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      await readFile(join(options.destination, "gateway.jar"), "utf8"),
      "synthetic-archive-not-runtime-admitted",
    );
  } finally {
    await cleanup(root);
  }
});
