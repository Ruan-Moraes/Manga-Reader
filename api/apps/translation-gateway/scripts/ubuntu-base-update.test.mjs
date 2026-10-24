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
