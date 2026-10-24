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
import { packageCodec, parsePackageOptions } from "./render-native-package.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function fixture() {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "native-package-test-")),
  );
  const options = {
    destination: join(root, "package"),
    webp: join(root, "webp"),
    sharp: join(root, "sharp"),
    copying: join(root, "COPYING"),
    patents: join(root, "PATENTS"),
    "webp-sha256": hash("library"),
    "sharp-sha256": hash("dependency"),
  };
  await writeFile(options.webp, "library");
  await writeFile(options.sharp, "dependency");
  await writeFile(
    options.copying,
    await readFile(
      new URL(
        "../src/test/resources/rendering-native-license/COPYING",
        import.meta.url,
      ),
    ),
  );
  await writeFile(
    options.patents,
    await readFile(
      new URL(
        "../src/test/resources/rendering-native-license/PATENTS",
        import.meta.url,
      ),
    ),
  );
  return { root, options };
}

test("arguments require explicit paths and pins, rejecting acquisition or cloud flags", () => {
  assert.throws(() => parsePackageOptions([]));
  assert.throws(() => parsePackageOptions(["--download", "true"]));
  assert.throws(() => parsePackageOptions(["--webp", "relative"]));
});

test("explicit amd64 package records its target without guessing the host or changing legacy arm64 metadata", async () => {
  const { root, options } = await fixture();
  try {
    const platform = "linux-x86_64-musl";
    const args = Object.entries({ ...options, platform }).flatMap(
      ([key, value]) => [`--${key}`, value],
    );
    assert.equal(parsePackageOptions(args).platform, platform);
    const result = await packageCodec(parsePackageOptions(args));
    const manifest = await readFile(
      join(options.destination, "manifest.properties"),
      "utf8",
    );
    assert.ok(manifest.includes(`platform=${platform}\n`));
    assert.equal(result.status, "packaged-not-admitted");
    for (const invalid of ["linux-amd64-musl", "linux-amd64-glibc", "", null])
      assert.throws(() =>
        parsePackageOptions(
          Object.entries({ ...options, platform: invalid }).flatMap(
            ([key, value]) => [`--${key}`, value],
          ),
        ),
      );
  } finally {
    await chmod(options.destination, 0o700).catch(() => {});
    await rm(root, { recursive: true, force: true });
  }
});

for (const platform of ["linux-aarch64-glibc", "linux-x86_64-glibc"]) {
  test(`explicit ${platform} metadata is not renamed to a musl target`, async () => {
    const { root, options } = await fixture();
    try {
      const parsed = parsePackageOptions(
        Object.entries({ ...options, platform }).flatMap(([key, value]) => [
          `--${key}`,
          value,
        ]),
      );
      const result = await packageCodec(parsed);
      assert.equal(result.status, "packaged-not-admitted");
      const manifest = await readFile(
        join(options.destination, "manifest.properties"),
        "utf8",
      );
      assert.ok(manifest.includes(`platform=${platform}\n`));
      assert.ok(!manifest.includes("-musl"));
    } finally {
      await chmod(options.destination, 0o700).catch(() => {});
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("bad pin or symbolic source fails before reserving a package", async () => {
  const { root, options } = await fixture();
  try {
    await assert.rejects(
      packageCodec({ ...options, "webp-sha256": "a".repeat(64) }),
    );
    await assert.rejects(lstat(options.destination), { code: "ENOENT" });
    await symlink(options.webp, join(root, "link"));
    await assert.rejects(
      packageCodec({ ...options, webp: join(root, "link") }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("license mismatch is rejected without substituting attribution", async () => {
  const { root, options } = await fixture();
  try {
    await writeFile(options.copying, "altered");
    await assert.rejects(packageCodec(options), /render-package-unavailable/);
    await assert.rejects(lstat(options.destination), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("package is create-only, deterministic, readonly and contains no source paths", async () => {
  const { root, options } = await fixture();
  try {
    const result = await packageCodec(options);
    assert.equal(result.status, "packaged-not-admitted");
    assert.equal((await lstat(options.destination)).mode & 0o222, 0);
    for (const name of result.files)
      assert.equal(
        (await lstat(join(options.destination, name))).mode & 0o222,
        0,
      );
    const manifest = await readFile(
      join(options.destination, "manifest.properties"),
    );
    assert.ok(manifest.toString().includes("platform=linux-aarch64-musl\n"));
    assert.equal(hash(manifest), result.manifestSha256);
    assert.ok(!manifest.toString().includes(root));
    await assert.rejects(packageCodec(options));
    assert.deepEqual(
      await readFile(join(options.destination, "manifest.properties")),
      manifest,
    );
  } finally {
    await chmod(options.destination, 0o700);
    await rm(root, { recursive: true, force: true });
  }
});

test("concurrent packaging reserves one directory without overwriting the winner", async () => {
  const { root, options } = await fixture();
  try {
    const results = await Promise.allSettled([
      packageCodec(options),
      packageCodec(options),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      await readFile(join(options.destination, "libwebp.so.7"), "utf8"),
      "library",
    );
    assert.equal(await readFile(options.webp, "utf8"), "library");
  } finally {
    await chmod(options.destination, 0o700);
    await rm(root, { recursive: true, force: true });
  }
});

// Real upstream licenses and ELF admission are exercised by the opt-in Java distribution test.
test("reserved or symbolic destination is never overwritten", async () => {
  const { root, options } = await fixture();
  try {
    await symlink(root, options.destination);
    await assert.rejects(packageCodec(options));
    assert.equal((await lstat(options.destination)).isSymbolicLink(), true);
    assert.equal(await readFile(options.webp, "utf8"), "library");
    await chmod(options.webp, 0o444);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
