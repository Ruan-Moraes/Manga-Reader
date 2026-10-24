import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  readdir,
  chmod,
  rm,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  parseIsolationImageOptions,
  prepareIsolationImage,
} from "./worker-isolation-image.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const source = new URL(
  "./isolation/WorkerIsolationProbe.java",
  import.meta.url,
);

test("requires explicit destination/hash; no push, download or credentials options", () => {
  for (const args of [
    [],
    ["--push", "true"],
    ["--download", "true"],
    ["--credentials", "/private"],
    ["--destination", "relative", "--source-sha256", "a".repeat(64)],
    ["--destination", "/private/tmp/a", "--source-sha256", "A".repeat(64)],
  ]) {
    assert.throws(
      () => parseIsolationImageOptions(args),
      /isolation-image-unavailable/,
    );
  }
});

test("compiles only the verified probe in an exclusive context and refuses concurrent overwrite", async () => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "isolation-image-test-")),
  );
  const destination = join(root, "prepared");
  const options = parseIsolationImageOptions([
    "--destination",
    destination,
    "--source-sha256",
    sha(await readFile(source)),
  ]);
  try {
    const attempts = await Promise.allSettled([
      prepareIsolationImage(options),
      prepareIsolationImage(options),
    ]);
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
    const result = attempts.find((r) => r.status === "fulfilled").value;
    assert.equal(result.status, "prepared-not-built");
    assert.equal(result.dockerPlatform, "linux/amd64");
    assert.match(result.baseImage, /^eclipse-temurin@sha256:[a-f0-9]{64}$/);
    assert.equal(
      result.baseImage,
      "eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a",
    );
    assert.equal(result.javaRelease, 23);
    assert.equal(result.runtimeMajor, 25);
    assert.equal(result.classCount, 8);
    assert.equal(result.securityApproved, false);
    assert.equal(result.published, false);
    assert.deepEqual(
      (await readdir(join(destination, "image"))).sort(),
      [".dockerignore", "Dockerfile", "classes", "image-inputs.json"].sort(),
    );
    const classes = await readdir(join(destination, "image", "classes"));
    assert.equal(classes.length, 8);
    for (const name of classes) {
      assert.match(
        name,
        /^WorkerIsolationProbe(?:\$(?:Access|Check|Control|Options|Report|Scratch|SystemAccess))?\.class$/,
      );
      const bytes = await readFile(join(destination, "image", "classes", name));
      assert.equal(bytes.readUInt32BE(0), 0xcafebabe);
      assert.equal(bytes.readUInt16BE(6), 67);
      assert.equal(result.files[`classes/${name}`], sha(bytes));
    }
    const dockerfile = await readFile(
      join(destination, "image", "Dockerfile"),
      "utf8",
    );
    assert.match(dockerfile, /USER 1000:1000/);
    assert.ok(dockerfile.startsWith(`FROM ${result.baseImage}\n`));
    assert.match(dockerfile, /ENTRYPOINT \["java"/);
    assert.ok(dockerfile.includes(options["source-sha256"]));
    assert.ok(!/^\s*(RUN|ADD|EXPOSE|HEALTHCHECK)\b/m.test(dockerfile));
    const manifest = await readFile(
      join(destination, "image", "image-inputs.json"),
      "utf8",
    );
    assert.ok(!manifest.includes(root));
    assert.ok(!manifest.includes("WorkerIsolationProbeChecks"));
    const previous = sha(Buffer.from(manifest));
    await assert.rejects(
      prepareIsolationImage(options),
      /isolation-image-unavailable/,
    );
    assert.equal(
      sha(await readFile(join(destination, "image", "image-inputs.json"))),
      previous,
    );
    await assert.rejects(
      prepareIsolationImage({
        ...options,
        destination: join(root, "bad-hash"),
        "source-sha256": "0".repeat(64),
      }),
      /isolation-image-unavailable/,
    );
    assert.ok(!(await readdir(root)).includes("bad-hash"));
  } finally {
    await chmod(join(destination, "image", "classes"), 0o700).catch(() => {});
    await rm(root, { recursive: true, force: true });
  }
});
