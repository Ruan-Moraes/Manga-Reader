import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Java 25 stack and toolchains are confined to the gateway", async () => {
  const gateway = await readFile(
    new URL("../pom.xml", import.meta.url),
    "utf8",
  );
  assert.match(gateway, /<java.version>25<\/java.version>/);
  assert.match(
    gateway,
    /<artifactId>spring-boot-starter-parent<\/artifactId>\s*<version>4\.1\.1<\/version>/,
  );
  assert.equal((gateway.match(/<jdkToolchain>/g) ?? []).length, 2);
  assert.ok(!gateway.includes("net.bytebuddy.experimental"));
  for (const path of [
    "../../../libs/testing-support/pom.xml",
    "../../core/pom.xml",
    "../../jobs/rating-aggregator/pom.xml",
    "../../jobs/orphan-cleaner/pom.xml",
    "../../jobs/trending-aggregator/pom.xml",
  ]) {
    const pom = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(pom, /<java.version>23<\/java.version>/);
  }
  const reactor = await readFile(
    new URL("../../../pom.xml", import.meta.url),
    "utf8",
  );
  assert.match(reactor, /<version>3\.4\.3<\/version>/);
  assert.match(reactor, /<module>apps\/translation-gateway<\/module>/);
});
