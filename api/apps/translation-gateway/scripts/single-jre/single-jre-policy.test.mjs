import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  excluded,
  verifyEntries,
  verifyMtree,
  verifyHardlinks,
} from "./single-jre-policy.mjs";
import { FILTER_PATTERNS } from "./single-jre-policy.mjs";
import { verifyRootfsRecords } from "./single-jre-policy.mjs";

test("only duplicate runtime, old startup hook and cache contents are excluded", () => {
  for (const p of [
    "opt/java/openjdk",
    "opt/java/openjdk/lib/server/libjvm.so",
    "__cacert_entrypoint.sh",
    "tmp/package.deb",
    "var/lib/apt/lists/archive",
    "var/cache/apt/archives/a.deb",
  ])
    assert.equal(excluded(p), true);
  for (const p of [
    "tmp/",
    "var/lib/apt/lists/",
    "var/cache/apt/archives/",
    "usr/lib/jvm/java-25-openjdk-arm64/lib/server/libjvm.so",
    "var/lib/dpkg/status",
    "etc/ssl/certs/java/cacerts",
    "opt/java/openjdk-neighbor",
  ])
    assert.equal(excluded(p), false);
});

test("actual bsdtar preserves root cache dirs and unrelated nested tmp; only contents removed", async (t) => {
  if (
    !spawnSync("/usr/bin/tar", ["--version"])
      .stdout?.toString()
      .startsWith("bsdtar ")
  )
    return t.skip("bsdtar required for the archive-copy fixture");
  const dir = await mkdtemp(join(tmpdir(), "toonlira-rootfs-filter-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const source = join(dir, "source");
  await mkdir(source);
  for (const p of [
    "tmp",
    "var/tmp",
    "var/lib/apt/lists",
    "var/cache/apt/archives",
    "usr/share/keep/tmp",
    "opt/java/openjdk",
    "opt/java/openjdk-neighbor",
  ]) {
    await mkdir(join(source, p), { recursive: true });
    await writeFile(join(source, p, "fixture"), "synthetic");
  }
  const run = (args) => {
    const r = spawnSync("/usr/bin/tar", args);
    assert.equal(r.status, 0);
    return r.stdout.toString();
  };
  const before = join(dir, "before.tar"),
    after = join(dir, "after.tar");
  run(["-cf", before, "-C", source, "."]);
  run([
    "-cf",
    after,
    "--format=pax",
    ...FILTER_PATTERNS.flatMap((p) => ["--exclude", p]),
    "@" + before,
  ]);
  const paths = run(["-tf", after])
    .trimEnd()
    .split("\n")
    .map((p) => p.replace(/^\.\//, "").replace(/\/$/, ""));
  for (const p of [
    "tmp",
    "var/tmp",
    "var/tmp/fixture",
    "var/lib/apt/lists",
    "var/cache/apt/archives",
    "usr/share/keep/tmp/fixture",
    "opt/java/openjdk-neighbor/fixture",
  ])
    assert.ok(paths.includes(p), "retained fixture missing");
  for (const p of [
    "tmp/fixture",
    "var/lib/apt/lists/fixture",
    "var/cache/apt/archives/fixture",
    "opt/java/openjdk/fixture",
  ])
    assert.ok(!paths.includes(p), "excluded fixture remained");
});

test("paths are canonical, bounded and unique; critical runtime remains present", () => {
  const before = [
    "opt/java/openjdk/lib/libzip.so",
    "usr/lib/jvm/java-25-openjdk-arm64/bin/java",
    "etc/ssl/certs/java/cacerts",
    "var/lib/dpkg/status",
  ];
  verifyEntries(before, before.slice(1), "arm64");
  for (const after of [
    before,
    before.slice(2),
    [...before.slice(1), "extra"],
    [...before.slice(1), before[1]],
    ["/outside", ...before.slice(1)],
    ["../outside", ...before.slice(1)],
  ])
    assert.throws(() => verifyEntries(before, after, "arm64"), {
      message: "single-jre-not-admitted",
    });
});

test("every retained file, symlink, mode and owner must match; only approved omissions", () => {
  const line = (p, values = "") =>
    "./" +
    p +
    " type=file uid=0 gid=0 mode=444 size=4 sha256digest=" +
    "a".repeat(64) +
    values;
  const before =
    line("usr/lib/kept") +
    "\n./usr/bin/java type=link uid=0 gid=0 mode=777 link=../lib/jvm/java/bin/java\n" +
    line("opt/java/openjdk/removed");
  const after = before.split("\n").slice(0, 2).join("\n");
  assert.equal(verifyMtree(before, after).retained, 2);
  for (const value of [
    after.replace("mode=444", "mode=666"),
    after.replace("uid=0", "uid=1"),
    after.replace("a".repeat(64), "b".repeat(64)),
    after.replace(
      "link=../lib/jvm/java/bin/java",
      "link=/opt/java/openjdk/bin/java",
    ),
    after + "\n" + line("unexpected"),
    after + "\n" + line("usr/lib/kept"),
    after.replace(" type=file", " type=unknown"),
  ])
    assert.throws(() => verifyMtree(before, value), {
      message: "single-jre-not-admitted",
    });
});

test("missing file digest is allowed only for an independently verified hardlink to hashed content", () => {
  const verbose =
    "hrwxr-xr-x  0 0 0 0 Sep 14 14:50 usr/bin/alias link to usr/bin/tool\n";
  const proof = verifyHardlinks(verbose, verbose);
  const before =
    "./usr/bin/tool type=file uid=0 gid=0 mode=755 size=4 sha256digest=" +
    "a".repeat(64) +
    "\n./usr/bin/alias type=file uid=0 gid=0 mode=755 size=0\n./opt/java/openjdk/removed type=dir uid=0 gid=0 mode=755";
  const after = before.split("\n").slice(0, 2).join("\n");
  assert.equal(verifyMtree(before, after, proof).retained, 2);
  assert.throws(() => verifyMtree(before, after), {
    message: "single-jre-not-admitted",
  });
  assert.throws(
    () =>
      verifyHardlinks(
        verbose,
        verbose.replace("link to usr/bin/tool", "link to usr/bin/changed"),
      ),
    { message: "single-jre-not-admitted" },
  );
  assert.throws(
    () => verifyMtree(before, after, new Map([["usr/bin/alias", "missing"]])),
    { message: "single-jre-not-admitted" },
  );
  assert.throws(
    () =>
      verifyMtree(before, after, new Map([["usr/bin/alias", "usr/bin/alias"]])),
    { message: "single-jre-not-admitted" },
  );
});

test("mtree octal escapes encode UTF-8 bytes, preserving Unicode filenames without normalization", () => {
  const kept = [
    "usr/lib/jvm/java-25-openjdk-arm64/bin/java",
    "etc/ssl/certs/java/cacerts",
    "var/lib/dpkg/status",
    "etc/cert-Főtanú.pem",
  ];
  const removed = "opt/java/openjdk/file";
  const encode = (value) =>
    [...Buffer.from(value)]
      .map((byte) =>
        byte >= 128
          ? "\\" + byte.toString(8).padStart(3, "0")
          : String.fromCharCode(byte),
      )
      .join("");
  const line = (p) =>
    "./" +
    encode(p) +
    " type=file uid=0 gid=0 mode=444 size=4 sha256digest=" +
    "a".repeat(64);
  const records = {
    beforeEntries: [...kept, removed].join("\n"),
    afterEntries: kept.join("\n"),
    beforeMtree: [...kept, removed].map(line).join("\n"),
    afterMtree: kept.map(line).join("\n"),
    beforeVerbose: "",
    afterVerbose: "",
  };
  assert.equal(verifyRootfsRecords(records, "arm64").entryProof.retained, 4);
  assert.throws(() =>
    verifyRootfsRecords(
      {
        ...records,
        afterMtree: records.afterMtree.replace("\\314\\213", "\\377"),
      },
      "arm64",
    ),
  );
  assert.throws(() =>
    verifyRootfsRecords(
      { ...records, afterEntries: kept.join("\n").normalize("NFC") },
      "arm64",
    ),
  );
});
