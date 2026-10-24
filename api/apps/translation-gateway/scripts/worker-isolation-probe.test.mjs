import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("standalone Java probe: synthetic boundaries, redaction and local CLI", async () => {
  assert.ok(
    /^\/\.local\/worker-isolation\/$/m.test(
      await readFile(
        new URL("../../../../.gitignore", import.meta.url),
        "utf8",
      ),
    ),
    "diagnostic artifacts must remain ignored",
  );
  const build = await mkdtemp(join(tmpdir(), "worker-isolation-test-"));
  const source = fileURLToPath(
    new URL("./isolation/WorkerIsolationProbe.java", import.meta.url),
  );
  const checks = fileURLToPath(
    new URL("./isolation/WorkerIsolationProbeChecks.java", import.meta.url),
  );
  const execute = (command, args) =>
    spawnSync(command, args, {
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 128 * 1024,
      env: {
        PATH: process.env.PATH,
        ...(process.env.JAVA_HOME ? { JAVA_HOME: process.env.JAVA_HOME } : {}),
      },
    });
  try {
    const compiled = execute("javac", ["-d", build, source, checks]);
    assert.equal(compiled.status, 0, compiled.stderr);
    const fixtures = execute("java", [
      "-cp",
      build,
      "WorkerIsolationProbeChecks",
    ]);
    assert.equal(fixtures.status, 0, fixtures.stderr);
    assert.equal(fixtures.stdout.trim(), "synthetic-checks-passed");
    const reportPath = join(build, "report.json");
    const observed = execute("java", [
      "-cp",
      build,
      "WorkerIsolationProbe",
      "--scratch",
      build,
      "--output",
      reportPath,
    ]);
    assert.equal(observed.status, 0, observed.stderr);
    const report = JSON.parse(observed.stdout);
    assert.equal(report.operationalApproval, false);
    assert.equal(report.nativeOperationsTested, false);
    assert.equal(report.probeVersion, "1.0");
    assert.equal(report.checks.length, 18);
    assert.equal(await readFile(reportPath, "utf8"), observed.stdout);
    assert.ok(!observed.stdout.includes(build));
    for (const check of report.checks)
      assert.ok(["PASS", "FAIL", "UNKNOWN"].includes(check.status));
    const repeated = execute("java", [
      "-cp",
      build,
      "WorkerIsolationProbe",
      "--scratch",
      build,
      "--output",
      reportPath,
    ]);
    assert.equal(repeated.status, 2);
    assert.equal(repeated.stderr.trim(), "isolation-probe-unavailable");
    assert.equal(await readFile(reportPath, "utf8"), observed.stdout);
    for (const args of [
      [],
      ["--scratch", "relative"],
      ["--scratch", build, "--scratch", build],
      ["--credentials", "private-secret"],
    ]) {
      const invalid = execute("java", [
        "-cp",
        build,
        "WorkerIsolationProbe",
        ...args,
      ]);
      assert.equal(invalid.status, 2);
      assert.equal(invalid.stderr.trim(), "isolation-probe-unavailable");
      assert.equal(invalid.stdout, "");
    }
    const script = await readFile(source, "utf8");
    for (const forbidden of [
      "System.getenv",
      "java.net",
      "ProcessBuilder",
      "loadLibrary",
      "java.lang.foreign",
      "SpringApplication",
      "setrlimit",
      "prlimit(",
    ]) {
      assert.ok(!script.includes(forbidden), forbidden);
    }
  } finally {
    await rm(build, { recursive: true, force: true });
  }
});
