import { strict as assert } from "node:assert";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  rebuild,
  BUILDER,
  WEBP,
  SHARP,
  MANIFEST,
} from "./rebuild-native-arm64.mjs";

test("pins the builder and all packaged outputs", () => {
  assert.match(BUILDER, /^sha256:[a-f0-9]{64}$/);
  for (const hash of [WEBP, SHARP, MANIFEST])
    assert.match(hash, /^[a-f0-9]{64}$/);
});

test("rejects relative paths and changed input before creating a destination", async () => {
  const dir = await mkdtemp(join(tmpdir(), "native-rebuild-test-"));
  const source = join(dir, "source.tar.gz");
  await writeFile(source, "invalid source");
  await assert.rejects(
    rebuild("relative", join(dir, "out")),
    /native-build-invalid-path/,
  );
  await assert.rejects(
    rebuild(source, join(dir, "out")),
    /render-package-unavailable/,
  );
  // A rejected input did not reserve the destination.
  await mkdir(join(dir, "out"));
});
