import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  readdir,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const UPDATES = Object.freeze({
  libfreetype6: Object.freeze({
    before: "2.13.2+dfsg-1ubuntu0.1",
    after: "2.13.2+dfsg-1ubuntu0.2",
  }),
  "libpng16-16t64": Object.freeze({
    before: "1.6.43-5ubuntu0.6",
    after: "1.6.43-5ubuntu0.7",
  }),
});
const BASES = Object.freeze({
  arm64:
    "eclipse-temurin@sha256:c31e783e090e5bcf4ddee2bfbce5bf78b5d832daae66767cb9a2315b8d4802b5",
  amd64:
    "eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a",
});
const SECURE_APT = [
  "-o",
  "Acquire::AllowInsecureRepositories=false",
  "-o",
  "Acquire::AllowWeakRepositories=false",
  "-o",
  "Acquire::AllowDowngradeToInsecureRepositories=false",
  "-o",
  "APT::Get::AllowUnauthenticated=false",
  "-o",
  "Acquire::Retries=0",
  "-o",
  "Acquire::http::Timeout=25",
  "-o",
  "Acquire::https::Timeout=25",
  "-o",
  "APT::Update::Error-Mode=any",
  "-o",
  "Dir::Cache::archives=/tmp/approved-packages/",
];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = () => {
  throw new Error("base-update-not-approved-or-inconsistent");
};

export function verifyDockerConfig(text) {
  try {
    const value = JSON.parse(text);
    if (JSON.stringify(value) !== '{"auths":{}}') fail();
  } catch {
    fail();
  }
}

export function verifyPlan(text, arch) {
  if (!Object.hasOwn(BASES, arch)) fail();
  const installed = new Set(),
    configured = new Set();
  for (const line of text.split("\n")) {
    if (/^Remv\b/.test(line)) fail();
    if (!/^(Inst|Conf)\b/.test(line)) continue;
    const match = line.match(
      /^(Inst|Conf) ([a-z0-9+-]+)(?::(arm64|amd64))?(?: \[([^\]]+)\])? \(([^ ]+) .* \[(arm64|amd64)\]\)$/,
    );
    if (!match) fail();
    const [, action, name, qualifier, old, version, architecture] = match;
    if (
      !Object.hasOwn(UPDATES, name) ||
      architecture !== arch ||
      (qualifier && qualifier !== arch) ||
      version !== UPDATES[name].after
    )
      fail();
    const seen = action === "Inst" ? installed : configured;
    if (seen.has(name) || (action === "Inst" && old !== UPDATES[name].before))
      fail();
    seen.add(name);
  }
  if (installed.size !== 2 || configured.size !== 2) fail();
  return [...installed].sort();
}

function inventory(text) {
  const result = new Map();
  for (const line of text.trimEnd().split("\n")) {
    const parts = line.split("\t");
    if (
      parts.length !== 3 ||
      result.has(parts[0]) ||
      !parts[0] ||
      !parts[1] ||
      parts[2].trimEnd() !== "ii"
    )
      fail();
    result.set(parts[0], parts[1]);
  }
  return result;
}
export function verifyInventory(beforeText, afterText, arch) {
  if (!Object.hasOwn(BASES, arch)) fail();
  const before = inventory(beforeText),
    after = inventory(afterText),
    changes = [];
  if (before.size !== after.size) fail();
  for (const [name, version] of before) {
    if (!after.has(name)) fail();
    if (after.get(name) === version) continue;
    const packageName = name.endsWith(`:${arch}`)
      ? name.slice(0, -arch.length - 1)
      : name;
    if (
      !Object.hasOwn(UPDATES, packageName) ||
      version !== UPDATES[packageName].before ||
      after.get(name) !== UPDATES[packageName].after
    )
      fail();
    changes.push({ package: name, before: version, after: after.get(name) });
  }
  if (
    changes.length !== 2 ||
    new Set(changes.map((item) => item.package)).size !== 2
  )
    fail();
  return changes;
}
export function verifyPackage(text, name, arch, actualHash) {
  if (!Object.hasOwn(UPDATES, name) || !Object.hasOwn(BASES, arch)) fail();
  const fields = {};
  for (const line of text.split("\n")) {
    const match = line.match(
      /^(Package|Version|Architecture|Filename|Size|SHA256): (.+)$/,
    );
    if (!match) continue;
    if (Object.hasOwn(fields, match[1])) fail();
    fields[match[1]] = match[2];
  }
  if (
    fields.Package !== name ||
    fields.Version !== UPDATES[name].after ||
    fields.Architecture !== arch ||
    !/^pool\/main\/[a-zA-Z0-9/_.+-]+\.deb$/.test(fields.Filename ?? "") ||
    fields.Filename.includes("..") ||
    !/^\d+$/.test(fields.Size ?? "") ||
    Number(fields.Size) < 1 ||
    Number(fields.Size) > 8 * 1024 * 1024 ||
    !/^[0-9a-f]{64}$/.test(fields.SHA256 ?? "") ||
    actualHash !== fields.SHA256
  )
    fail();
  return {
    name,
    version: fields.Version,
    architecture: arch,
    filename: fields.Filename,
    bytes: Number(fields.Size),
    sha256: actualHash,
  };
}

/** Explicit opt-in only. Creates a new local container/image; never upgrades host or existing images. */
export async function prepareBase(options) {
  const keys = [
    "architecture",
    "destination",
    "docker-config",
    "docker-host",
    "approve-two-package-install",
  ];
  if (
    !options ||
    Object.keys(options).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(options, key)) ||
    !Object.hasOwn(BASES, options.architecture) ||
    options["approve-two-package-install"] !== "yes" ||
    !/^unix:\/\/\/[^\n]+$/.test(options["docker-host"])
  )
    fail();
  for (const path of [options.destination, options["docker-config"]])
    if (!isAbsolute(path) || resolve(path) !== path) fail();
  if (
    (await realpath(dirname(options.destination))) !==
      dirname(options.destination) ||
    (await realpath(options["docker-config"])) !== options["docker-config"]
  )
    fail();
  const configFiles = await readdir(options["docker-config"]);
  if (configFiles.length) {
    if (configFiles.length !== 1 || configFiles[0] !== "config.json") fail();
    const configPath = join(options["docker-config"], "config.json");
    const stat = await lstat(configPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024) fail();
    verifyDockerConfig(await readFile(configPath, "utf8"));
  }
  await mkdir(options.destination, { mode: 0o700 });
  const files = {},
    commands = [];
  const save = async (name, value) => {
    const bytes = Buffer.from(
      typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n",
    );
    await writeFile(join(options.destination, name), bytes, {
      flag: "wx",
      mode: 0o600,
    });
    files[name] = sha(bytes);
  };
  const docker = async (args, log) => {
    commands.push(args);
    const result = await new Promise((done, reject) => {
      const child = spawn(
        "docker",
        ["--config", options["docker-config"], ...args],
        {
          env: {
            PATH: process.env.PATH,
            LANG: "C.UTF-8",
            DOCKER_HOST: options["docker-host"],
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let stdout = "",
        stderr = "",
        bytes = 0;
      const consume = (chunk, isError) => {
        bytes += chunk.length;
        if (bytes > 16 * 1024 * 1024) {
          child.kill();
          return;
        }
        if (isError) stderr += chunk;
        else stdout += chunk;
      };
      child.stdout.on("data", (chunk) => consume(chunk, false));
      child.stderr.on("data", (chunk) => consume(chunk, true));
      child.on("error", reject);
      child.on("close", (code) => done({ code, stdout, stderr, bytes }));
    });
    if (log) await save(log, result.stdout + result.stderr);
    if (result.code !== 0 || result.bytes > 16 * 1024 * 1024)
      throw new Error("base-update-command-failed");
    return result.stdout;
  };
  const base = BASES[options.architecture];
  let id, imageId, changes, proofs;
  try {
    const original = JSON.parse(
      await docker(["image", "inspect", base], "base-inspect.json"),
    )[0];
    if (
      original.Architecture !== options.architecture ||
      original.Config.Labels?.["org.opencontainers.image.version"] !== "24.04"
    )
      fail();
    id = (
      await docker(
        [
          "create",
          "--pull=never",
          "--platform",
          `linux/${options.architecture}`,
          "--name",
          `toonlira-base-update-${randomUUID()}`,
          "--cap-drop=ALL",
          "--cap-add=CHOWN",
          "--cap-add=DAC_OVERRIDE",
          "--cap-add=FOWNER",
          "--cap-add=SETUID",
          "--cap-add=SETGID",
          "--pids-limit=128",
          "--memory=512m",
          "--entrypoint",
          "/bin/sh",
          base,
          "-c",
          "sleep infinity",
        ],
        "container-id.txt",
      )
    ).trim();
    if (!/^[0-9a-f]{64}$/.test(id)) fail();
    await docker(["start", id]);
    const exec = (args, log) =>
      docker(
        [
          "exec",
          "--env",
          "LC_ALL=C",
          "--env",
          "DEBIAN_FRONTEND=noninteractive",
          id,
          ...args,
        ],
        log,
      );
    const invArgs = [
      "dpkg-query",
      "-W",
      "-f=${binary:Package}\t${Version}\t${db:Status-Abbrev}\n",
    ];
    const before = await exec(invArgs, "packages-before.tsv");
    inventory(before);
    const jreCommand = [
      "sh",
      "-ec",
      "find /opt/java/openjdk -type f -exec sha256sum {} + | sort",
    ];
    const jreBefore = await exec(jreCommand, "jre-before.sha256");
    await exec(
      ["sha256sum", "/usr/share/keyrings/ubuntu-archive-keyring.gpg"],
      "archive-keyring.sha256",
    );
    await exec(
      ["sed", "-n", "1,180p", "/etc/apt/sources.list.d/ubuntu.sources"],
      "ubuntu.sources.txt",
    );
    await exec(["mkdir", "-p", "/tmp/approved-packages/partial"]);
    await exec(
      ["apt-get", ...SECURE_APT, "-o", "Debug::Acquire::gpgv=true", "update"],
      "apt-update.log",
    );
    const signatures = await exec(
      [
        "sh",
        "-ec",
        'count=0; for release in /var/lib/apt/lists/*_InRelease; do test -f "$release"; gpgv --status-fd=1 --keyring /usr/share/keyrings/ubuntu-archive-keyring.gpg "$release"; sha256sum "$release"; count=$((count+1)); done; test "$count" -ge 3',
      ],
      "release-signatures.log",
    );
    if ((signatures.match(/\[GNUPG:\] VALIDSIG /g) ?? []).length < 3) fail();
    const pins = Object.entries(UPDATES).map(
      ([name, versions]) => `${name}=${versions.after}`,
    );
    const installArgs = [
      "--no-install-recommends",
      "--no-remove",
      "install",
      ...pins,
    ];
    const plan = await exec(
      ["apt-get", ...SECURE_APT, "--simulate", ...installArgs],
      "apt-plan.log",
    );
    verifyPlan(plan, options.architecture);
    await exec(
      [
        "apt-get",
        ...SECURE_APT,
        "--download-only",
        "--assume-yes",
        ...installArgs,
      ],
      "apt-download.log",
    );
    const hashes = await exec(
      ["sh", "-ec", "sha256sum /tmp/approved-packages/*.deb"],
      "package-files.sha256",
    );
    const rows = hashes.trim().split("\n");
    if (rows.length !== 2) fail();
    proofs = [];
    for (const [name, versions] of Object.entries(UPDATES)) {
      const row = rows.find((line) =>
        line.includes(`/${name}_${versions.after}_${options.architecture}.deb`),
      );
      if (
        !row ||
        !/^[0-9a-f]{64}  \/tmp\/approved-packages\/[a-zA-Z0-9_.+-]+\.deb$/.test(
          row,
        )
      )
        fail();
      const metadata = await exec(
        ["apt-cache", "show", `${name}=${versions.after}`],
        `${name}-metadata.txt`,
      );
      proofs.push(
        verifyPackage(metadata, name, options.architecture, row.slice(0, 64)),
      );
    }
    await save("approved-plan.json", {
      base,
      architecture: options.architecture,
      packages: proofs,
      planSha256: sha(plan),
      releaseSignaturesSha256: sha(signatures),
      status: "verified-before-install",
    });
    await docker(["network", "disconnect", "bridge", id]);
    await exec(
      [
        "apt-get",
        ...SECURE_APT,
        "--no-download",
        "--assume-yes",
        ...installArgs,
      ],
      "apt-install.log",
    );
    const after = await exec(invArgs, "packages-after.tsv");
    changes = verifyInventory(before, after, options.architecture);
    const jreAfter = await exec(jreCommand, "jre-after.sha256");
    if (jreAfter !== jreBefore) fail();
    imageId = (
      await docker(
        [
          "commit",
          "--change",
          `ENTRYPOINT ${JSON.stringify(original.Config.Entrypoint ?? [])}`,
          "--change",
          `CMD ${JSON.stringify(original.Config.Cmd ?? [])}`,
          "--change",
          `LABEL com.toonlira.base.parent=${base}`,
          "--change",
          `LABEL com.toonlira.base.approved-packages=${sha(JSON.stringify(proofs))}`,
          id,
        ],
        "new-image-id.txt",
      )
    ).trim();
    if (!/^sha256:[0-9a-f]{64}$/.test(imageId)) fail();
    const updated = JSON.parse(
      await docker(["image", "inspect", imageId], "new-image-inspect.json"),
    )[0];
    for (const key of ["Env", "Entrypoint", "User", "WorkingDir"])
      if (
        JSON.stringify(original.Config[key]) !==
        JSON.stringify(updated.Config[key])
      )
        fail();
    if (updated.Architecture !== original.Architecture) fail();
    await save("result.json", {
      format: "toonlira-local-base-update-1",
      recordedAt: new Date().toISOString(),
      base,
      architecture: options.architecture,
      imageId,
      packages: proofs,
      changes,
      jreInventorySha256: sha(jreBefore),
      status: "local-only-not-security-approved",
      files,
    });
    return {
      imageId,
      architecture: options.architecture,
      status: "local-only-not-security-approved",
    };
  } catch (error) {
    await save("failure.json", {
      recordedAt: new Date().toISOString(),
      status: "not-admitted",
      code:
        error.message === "base-update-command-failed"
          ? error.message
          : "base-update-not-approved-or-inconsistent",
      imageId: imageId ?? null,
    });
    throw error;
  } finally {
    if (id && /^[0-9a-f]{64}$/.test(id)) {
      // Exact owned temporary container only. Original and derived images are preserved.
      await docker(["stop", "--time=2", id], "container-stop.log").catch(
        () => {},
      );
      await docker(["rm", id], "container-remove.log").catch(() => {});
    }
    await save("commands.json", commands);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2),
      options = {};
    for (let i = 0; i < args.length; i += 2) {
      if (
        !args[i]?.startsWith("--") ||
        !args[i + 1] ||
        Object.hasOwn(options, args[i].slice(2))
      )
        fail();
      options[args[i].slice(2)] = args[i + 1];
    }
    process.stdout.write(JSON.stringify(await prepareBase(options)) + "\n");
  } catch {
    process.stderr.write(
      "base-update-not-admitted; inspect local preparation evidence\n",
    );
    process.exitCode = 1;
  }
}
