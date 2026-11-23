import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("all services use Java 25 while the gateway keeps its independent Boot stack", async () => {
  const gateway = await readFile(
    new URL("../../pom.xml", import.meta.url),
    "utf8",
  );
  assert.match(gateway, /<java.version>25<\/java.version>/);
  assert.match(
    gateway,
    /<artifactId>spring-boot-starter-parent<\/artifactId>\s*<version>4\.1\.1<\/version>/,
  );
  assert.doesNotMatch(gateway, /<jdkToolchain>/);
  assert.ok(!gateway.includes("net.bytebuddy.experimental"));
  for (const path of [
    "../../../../libs/testing-support/pom.xml",
    "../../../core/pom.xml",
    "../../../jobs/rating-aggregator/pom.xml",
    "../../../jobs/orphan-cleaner/pom.xml",
    "../../../jobs/trending-aggregator/pom.xml",
  ]) {
    const pom = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(pom, /<java.version>25<\/java.version>/);
  }
  const reactor = await readFile(
    new URL("../../../../pom.xml", import.meta.url),
    "utf8",
  );
  assert.match(reactor, /<version>3\.5\.16<\/version>/);
  assert.match(reactor, /<module>apps\/translation-gateway<\/module>/);
});
