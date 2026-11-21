import test from "node:test";
import assert from "node:assert/strict";
import {
  verifyPlan,
  verifyInventory,
  verifyPackage,
  verifyDockerConfig,
  prepareBase,
} from "./ubuntu-base-update.mjs";

test("missing approval, remote daemon, unknown package and unsupported target fail before Docker", async () => {
  const options = {
    architecture: "arm64",
    destination: "/missing-exclusive-destination",
    "docker-config": "/missing-isolated-config",
    "docker-host": "unix:///missing-local.sock",
    "approve-two-package-install": "yes",
  };
  for (const changed of [
    { "approve-two-package-install": "no" },
    { "approve-two-package-install": null },
    { "docker-host": "tcp://remote.example:2375" },
    { architecture: "host" },
    { package: "extra" },
    { destination: "relative" },
  ]) {
    await assert.rejects(prepareBase({ ...options, ...changed }), (error) => {
      assert.equal(error.message, "base-update-not-approved-or-inconsistent");
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test("Docker config has no credentials, helpers, proxy or remote context", () => {
  verifyDockerConfig('{"auths":{}}');
  for (const value of [
    '{"auths":{"registry":{"auth":"synthetic"}}}',
    '{"auths":{},"credsStore":"osxkeychain"}',
    '{"auths":{},"currentContext":"remote"}',
    '{"auths":{},"proxies":{}}',
    "{}",
    '{"auths":synthetic-invalid-secret-fragment',
  ])
    assert.throws(() => verifyDockerConfig(value));
  assert.throws(
    () => verifyDockerConfig("synthetic-invalid-secret-fragment"),
    (error) => {
      assert.equal(error.message, "base-update-not-approved-or-inconsistent");
      assert.equal(error.cause, undefined);
      return true;
    },
  );
});

const plan =
  "Inst libfreetype6 [2.13.2+dfsg-1ubuntu0.1] (2.13.2+dfsg-1ubuntu0.2 Ubuntu:24.04/noble-security [arm64])\n" +
  "Inst libpng16-16t64 [1.6.43-5ubuntu0.6] (1.6.43-5ubuntu0.7 Ubuntu:24.04/noble-security [arm64])\n" +
  "Conf libfreetype6 (2.13.2+dfsg-1ubuntu0.2 Ubuntu:24.04/noble-security [arm64])\n" +
  "Conf libpng16-16t64 (1.6.43-5ubuntu0.7 Ubuntu:24.04/noble-security [arm64])\n";
test("only the two approved exact updates may be resolved", () => {
  assert.deepEqual(verifyPlan(plan, "arm64"), [
    "libfreetype6",
    "libpng16-16t64",
  ]);
  for (const invalid of [
    "",
    plan + "Inst libc6 (2.39 Ubuntu [arm64])\n",
    plan + "Remv zlib1g [1.3]\n",
    plan + "Conf libc6 (2.39 Ubuntu [arm64])\n",
    plan.replaceAll("0.7", "0.8"),
    plan.replaceAll("arm64", "amd64"),
    plan + plan,
    plan.replace("[1.6.43-5ubuntu0.6]", "[1.6.43-5ubuntu0.7]"),
  ])
    assert.throws(() => verifyPlan(invalid, "arm64"), /base-update/);
});
test("separate ARM64 refresh allows only pinned Brotli and zlib upgrades", () => {
  const profile = "security-refresh-2026-10-27";
  const refreshPlan =
    "Inst zlib1g [1:1.3.dfsg-3.1ubuntu2.2] (1:1.3.dfsg-3.1ubuntu2.3 Ubuntu:24.04/noble-security [arm64])\n" +
    "Conf zlib1g (1:1.3.dfsg-3.1ubuntu2.3 Ubuntu:24.04/noble-security [arm64])\n" +
    "Inst libbrotli1 [1.1.0-2build2] (1.1.0-2ubuntu0.1 Ubuntu:24.04/noble-security [arm64])\n" +
    "Conf libbrotli1 (1.1.0-2ubuntu0.1 Ubuntu:24.04/noble-security [arm64])\n";
  assert.deepEqual(verifyPlan(refreshPlan, "arm64", profile), ["libbrotli1", "zlib1g"]);
  assert.throws(() => verifyPlan(refreshPlan, "arm64"), /base-update/);
  assert.throws(() => verifyPlan(refreshPlan, "amd64", profile), /base-update/);
  assert.throws(() => verifyPlan(refreshPlan + "Inst extra (1 Ubuntu [arm64])\n", "arm64", profile), /base-update/);
  const before = "zlib1g:arm64\t1:1.3.dfsg-3.1ubuntu2.2\tii \nlibbrotli1:arm64\t1.1.0-2build2\tii \n";
  const after = before.replace("ubuntu2.2", "ubuntu2.3").replace("2build2", "2ubuntu0.1");
  assert.equal(verifyInventory(before, after, "arm64", profile).length, 2);
  assert.throws(() => verifyInventory(before, after + "extra\t1\tii \n", "arm64", profile), /base-update/);
});
test("whole installed inventory differs by exactly two upgrades, no removals or extras", () => {
  const before =
    "libc6:arm64\t2.39\tii \nlibfreetype6:arm64\t2.13.2+dfsg-1ubuntu0.1\tii \nlibpng16-16t64:arm64\t1.6.43-5ubuntu0.6\tii \n";
  const after = before.replace("0.1", "0.2").replace("0.6", "0.7");
  assert.equal(verifyInventory(before, after, "arm64").length, 2);
  for (const invalid of [
    after + "extra\t1\tii \n",
    after.replace("libc6:arm64\t2.39\tii \n", ""),
    after.replace("2.39", "2.40"),
    after.replace("ii ", "iU "),
    after + "libc6:arm64\t2.39\tii \n",
    before,
  ])
    assert.throws(
      () => verifyInventory(before, invalid, "arm64"),
      /base-update/,
    );
});
test("package proof requires identity, architecture, SHA256 and bounded official filename", () => {
  const hash = "a".repeat(64);
  const metadata =
    "Package: libpng16-16t64\nVersion: 1.6.43-5ubuntu0.7\nArchitecture: arm64\n" +
    "Filename: pool/main/libp/libpng1.6/libpng16-16t64_1.6.43-5ubuntu0.7_arm64.deb\n" +
    `Size: 200000\nSHA256: ${hash}\n`;
  assert.equal(
    verifyPackage(metadata, "libpng16-16t64", "arm64", hash).sha256,
    hash,
  );
  for (const changed of [
    metadata.replace("arm64", "amd64"),
    metadata.replace("0.7", "0.8"),
    metadata.replace("pool/main/", "../"),
    metadata + "SHA256: " + hash + "\n",
    metadata.replace(hash, "b".repeat(64)),
    metadata.replace("200000", "99999999"),
  ])
    assert.throws(
      () => verifyPackage(changed, "libpng16-16t64", "arm64", hash),
      /base-update/,
    );
});

test("security refresh rejects changed package hash even when authenticated metadata agrees", () => {
  for (const [name, version, expected] of [
    ["libbrotli1", "1.1.0-2ubuntu0.1", "911411fb6fdfb4ab91dd4242f5a0a5e1f47b38e003a25c8dc7730238cb323e18"],
    ["zlib1g", "1:1.3.dfsg-3.1ubuntu2.3", "84536bcf440cf0f988899b24b6c7df32cb9ff9f0dfa97d5e7efcc2dc088d15dc"],
  ]) {
    const metadata = (hash) =>
      `Package: ${name}\nVersion: ${version}\nArchitecture: arm64\n` +
      `Filename: pool/main/example/${name}_arm64.deb\nSize: 200000\nSHA256: ${hash}\n`;
    assert.equal(verifyPackage(metadata(expected), name, "arm64", expected,
      "security-refresh-2026-10-27").sha256, expected);
    const changed = "a".repeat(64);
    assert.throws(() => verifyPackage(metadata(changed), name, "arm64", changed,
      "security-refresh-2026-10-27"), /base-update/);
  }
});
