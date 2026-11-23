import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  readFile,
  lstat,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  auditRootfsArchives,
  filterRootfsArchive,
  readRootfsPathInventory,
} from "./rootfs-archive-audit.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
import {
  pax,
  member,
  archive,
} from "./test-support/rootfs-archive-fixture.mjs";
function kept(arch = "arm64") {
  return [
    member(`usr/lib/jvm/java-25-openjdk-${arch}/bin/java`),
    member("etc/ssl/certs/java/cacerts"),
    member("var/lib/dpkg/status"),
  ];
}
test("path inventory comes from pinned physical headers with literal Unicode and immutable paths", async (t) => {
  const options = await pair(
    t,
    archive([...kept(), member("etc/Fő.pem")]),
    archive(kept()),
  );
  const inventory = await readRootfsPathInventory({
    path: options.before,
    sha256: options.beforeSha256,
  });
  assert.ok(inventory.paths.includes("etc/Fő.pem"));
  assert.ok(!inventory.paths.includes("etc/Fő.pem".normalize("NFD")));
  assert.throws(() => inventory.paths.push("added"), TypeError);
  await assert.rejects(
    readRootfsPathInventory({ path: options.before, sha256: "0".repeat(64) }),
  );
});
async function pair(t, before, after, architecture = "arm64") {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "rootfs-archive-audit-test-")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const beforePath = join(root, "before.tar"),
    afterPath = join(root, "after.tar");
  await writeFile(beforePath, before, { mode: 0o444 });
  await writeFile(afterPath, after, { mode: 0o444 });
  return {
    before: beforePath,
    after: afterPath,
    beforeSha256: sha(before),
    afterSha256: sha(after),
    architecture,
  };
}
for (const arch of ["arm64", "amd64"])
  test(`reads physical headers/content for ${arch}, not listings or extracted files`, async (t) => {
    const files = kept(arch),
      unicode = member("placeholder", {
        extended: [["path", "etc/cer-Főtanú.pem"]],
      });
    const options = await pair(
      t,
      archive([...files, unicode, member("opt/java/openjdk/bin/java")]),
      archive([...files, unicode]),
      arch,
    );
    const result = await auditRootfsArchives(options);
    assert.equal(result.retained, 4);
    assert.equal(result.removed, 1);
    assert.equal(result.status, "archive-equivalence-verified-not-operational");
    assert.equal(result.filesystemMetadataVerified, false);
    assert.equal(result.securityApproved, false);
    assert.equal(result.before.securityMetadataEntries, 0);
    assert.ok(!JSON.stringify(result).includes(options.before));
  });
test("compares binary xattrs and ACLs byte-for-byte, without exposing their values", async (t) => {
  const files = kept(),
    value = Buffer.from([0, 255, 10, 61, 1]);
  const extra = member("usr/bin/tool", {
    extended: [
      ["SCHILY.xattr.security.capability", value],
      ["SCHILY.acl.access", "user::r--,group::r--,other::---"],
    ],
  });
  const options = await pair(
    t,
    archive([...files, extra, member("tmp/drop")]),
    archive([...files, extra]),
  );
  const result = await auditRootfsArchives(options);
  assert.equal(result.after.securityMetadataEntries, 1);
  assert.equal(result.after.paxKeys["SCHILY.xattr.security.capability"], 1);
  assert.ok(!JSON.stringify(result).includes("user::r--"));
  for (const bad of [
    member("usr/bin/tool"),
    member("usr/bin/tool", {
      extended: [
        ["SCHILY.xattr.security.capability", Buffer.from([0, 254, 10, 61, 1])],
      ],
    }),
  ]) {
    const changed = await pair(
      t,
      archive([...files, extra, member("tmp/drop")]),
      archive([...files, bad]),
    );
    await assert.rejects(auditRootfsArchives(changed), {
      message: "rootfs-audit-unavailable",
    });
  }
});
test("rejects retained content, mode, owner, link target or additional entry changes", async (t) => {
  const files = kept(),
    file = member("usr/keep"),
    link = member("usr/link", {
      type: "2",
      bytes: Buffer.alloc(0),
      link: "keep",
    });
  for (const changed of [
    member("usr/keep", { bytes: Buffer.from("evil") }),
    member("usr/keep", { mode: 0o777 }),
    member("usr/keep", { uid: 1 }),
  ]) {
    const options = await pair(
      t,
      archive([...files, file, member("tmp/drop")]),
      archive([...files, changed]),
    );
    await assert.rejects(auditRootfsArchives(options));
  }
  for (const additions of [
    [member("usr/new")],
    [
      member("usr/link", {
        type: "2",
        bytes: Buffer.alloc(0),
        link: "/outside",
      }),
    ],
  ]) {
    const options = await pair(
      t,
      archive([...files, link, member("tmp/drop")]),
      archive([...files, ...additions]),
    );
    await assert.rejects(auditRootfsArchives(options));
  }
});
test("hardlinks require the same hashed regular target; dangling and cycles fail", async (t) => {
  const files = kept(),
    target = member("usr/tool"),
    link = member("usr/alias", {
      type: "1",
      bytes: Buffer.alloc(0),
      link: "usr/tool",
    });
  const good = await pair(
    t,
    archive([...files, target, link, member("tmp/drop")]),
    archive([...files, target, link]),
  );
  assert.equal((await auditRootfsArchives(good)).after.hardlinks, 1);
  for (const badLink of [
    member("usr/alias", {
      type: "1",
      bytes: Buffer.alloc(0),
      link: "usr/missing",
    }),
    member("usr/alias", {
      type: "1",
      bytes: Buffer.alloc(0),
      link: "usr/alias",
    }),
  ]) {
    const options = await pair(
      t,
      archive([...files, target, badLink, member("tmp/drop")]),
      archive([...files, target, badLink]),
    );
    await assert.rejects(auditRootfsArchives(options));
  }
});
test("rejects malformed checksums, PAX lengths/duplicates, unsupported extensions and unsafe paths", async (t) => {
  const files = kept();
  const broken = member("usr/tool");
  broken[100] = 55;
  for (const extra of [
    broken,
    member("usr/tool", { extended: [["path", "../outside"]] }),
    member("../outside"),
    member("usr/tool", {
      extended: [
        ["path", "one"],
        ["path", "two"],
      ],
    }),
    member("PaxHeader", { type: "x", bytes: Buffer.from("3 path=a\n") }),
    member("usr/tool", { extended: [["GNU.sparse.map", "0,1"]] }),
    member("longname", { type: "L" }),
    member("global", { type: "g", bytes: pax("uid", "1") }),
  ]) {
    const options = await pair(
      t,
      archive([...files, extra, member("tmp/drop")]),
      archive(files),
    );
    await assert.rejects(auditRootfsArchives(options), {
      message: "rootfs-audit-unavailable",
    });
  }
});
test("rejects truncation, missing end blocks, trailing data, duplicate paths and unknown charset", async (t) => {
  const files = kept();
  for (const bad of [
    archive(files).subarray(0, -1),
    Buffer.concat(files),
    Buffer.concat([archive(files), Buffer.alloc(512, 1)]),
    archive([...files, files[0]]),
    archive([
      ...files,
      member("usr/tool", { extended: [["hdrcharset", "BINARY"]] }),
    ]),
  ]) {
    const options = await pair(t, bad, archive(files));
    await assert.rejects(auditRootfsArchives(options));
  }
});
test("requires readonly canonical inputs and explicit correct hashes/architecture", async (t) => {
  const files = kept(),
    options = await pair(
      t,
      archive([...files, member("tmp/drop")]),
      archive(files),
    );
  for (const bad of [
    { ...options, beforeSha256: "0".repeat(64) },
    { ...options, architecture: "unknown" },
    { ...options, before: "relative" },
  ])
    await assert.rejects(auditRootfsArchives(bad));
  await chmod(options.after, 0o600);
  await assert.rejects(auditRootfsArchives(options));
  await rm(options.after);
  await symlink(options.before, options.after);
  await assert.rejects(auditRootfsArchives(options));
});
test("streaming filter preserves raw Unicode headers, binary PAX metadata and untouched contents", async (t) => {
  const files = kept(),
    special = member("etc/cert-Főtanúsítvány.pem", {
      extended: [
        ["SCHILY.xattr.security.capability", Buffer.from([0, 255, 10])],
      ],
    });
  const options = await pair(
    t,
    archive([
      ...files,
      special,
      member("tmp/drop"),
      member("opt/java/openjdk/bin/java"),
    ]),
    archive([...files, special]),
  );
  const destination = join(
    options.before.slice(0, options.before.lastIndexOf("/")),
    "filtered",
  );
  const result = await filterRootfsArchive({
    source: options.before,
    sourceSha256: options.beforeSha256,
    architecture: "arm64",
    destination,
  });
  assert.equal(result.audit.retained, 4);
  assert.equal(result.audit.removed, 2);
  assert.equal(result.rootfsSha256, options.afterSha256);
  assert.equal(result.audit.after.securityMetadataEntries, 1);
  await assert.rejects(
    filterRootfsArchive({
      source: options.before,
      sourceSha256: options.beforeSha256,
      architecture: "arm64",
      destination,
    }),
  );
});
test("Unicode normalization changes invalidate archive equivalence instead of being accepted as aliases", async (t) => {
  const files = kept(),
    name = "etc/cert-Főtanúsítvány.pem";
  const options = await pair(
    t,
    archive([...files, member(name), member("tmp/drop")]),
    archive([...files, member(name.normalize("NFD"))]),
  );
  await assert.rejects(auditRootfsArchives(options));
});
test("exclusive filter admission wins once under concurrency; incorrect pins leave no success receipt", async (t) => {
  const files = kept(),
    options = await pair(
      t,
      archive([...files, member("tmp/drop")]),
      archive(files),
    );
  const root = options.before.slice(0, options.before.lastIndexOf("/"));
  const request = {
    source: options.before,
    sourceSha256: options.beforeSha256,
    architecture: "arm64",
    destination: join(root, "concurrent"),
  };
  const outcomes = await Promise.allSettled([
    filterRootfsArchive(request),
    filterRootfsArchive(request),
  ]);
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  assert.equal(sha(await readFile(options.before)), options.beforeSha256);
  const bad = {
    ...request,
    sourceSha256: "0".repeat(64),
    destination: join(root, "failed"),
  };
  await assert.rejects(filterRootfsArchive(bad), {
    message: "rootfs-filter-incomplete",
  });
  await assert.rejects(lstat(join(bad.destination, "filter.json")), {
    code: "ENOENT",
  });
  await assert.rejects(filterRootfsArchive(bad));
});
