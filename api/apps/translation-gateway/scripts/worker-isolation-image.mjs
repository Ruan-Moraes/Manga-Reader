import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkedFile } from "./render-native-package.mjs";

const execute = promisify(execFile);
const BASE_IMAGE =
  "eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a";
const CLASS_NAMES = [
  "WorkerIsolationProbe.class",
  ...[
    "Access",
    "Check",
    "Control",
    "Options",
    "Report",
    "Scratch",
    "SystemAccess",
  ].map((name) => `WorkerIsolationProbe$${name}.class`),
].sort();
const OPTIONS = ["destination", "source-sha256"];
const MAX_SOURCE_BYTES = 65536,
  MAX_CLASS_BYTES = 65536;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (reserved) => {
  throw new Error(
    reserved ? "isolation-image-incomplete" : "isolation-image-unavailable",
  );
};

export function parseIsolationImageOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]?.slice(2);
    if (
      !args[index]?.startsWith("--") ||
      !OPTIONS.includes(key) ||
      Object.hasOwn(options, key) ||
      !args[index + 1]
    )
      fail();
    options[key] = args[index + 1];
  }
  validate(options);
  return options;
}
function validate(options) {
  if (
    !options ||
    Object.keys(options).length !== OPTIONS.length ||
    Object.keys(options).some((key) => !OPTIONS.includes(key)) ||
    typeof options.destination !== "string" ||
    !isAbsolute(options.destination) ||
    resolve(options.destination) !== options.destination ||
    typeof options["source-sha256"] !== "string" ||
    !/^[a-f0-9]{64}$/.test(options["source-sha256"])
  )
    fail();
}

/** Prepares files only. Docker, network, SDKs and credentials are never invoked here. */
export async function prepareIsolationImage(options) {
  let reserved = false;
  try {
    validate(options);
    const source = await checkedFile(
      fileURLToPath(
        new URL("./isolation/WorkerIsolationProbe.java", import.meta.url),
      ),
      options["source-sha256"],
      MAX_SOURCE_BYTES,
    );
    if (
      (await realpath(dirname(options.destination))) !==
      dirname(options.destination)
    )
      fail();
    let dockerfile = await readFile(
      new URL("../Dockerfile.isolation-probe", import.meta.url),
      "utf8",
    );
    if (
      !dockerfile.startsWith(`FROM ${BASE_IMAGE}\n`) ||
      dockerfile.split("PROBE_SOURCE_SHA256").length !== 2
    )
      fail();
    dockerfile = dockerfile.replace(
      "PROBE_SOURCE_SHA256",
      options["source-sha256"],
    );
    await mkdir(options.destination, { mode: 0o700 });
    reserved = true;
    const compilation = join(options.destination, "compilation"),
      image = join(options.destination, "image"),
      classes = join(image, "classes");
    await mkdir(compilation, { mode: 0o700 });
    await mkdir(image, { mode: 0o700 });
    await mkdir(classes, { mode: 0o700 });
    const sourcePath = join(compilation, "WorkerIsolationProbe.java");
    await writeFile(sourcePath, source, { flag: "wx", mode: 0o400 });
    const env = {
      PATH: process.env.PATH,
      ...(process.env.JAVA_HOME ? { JAVA_HOME: process.env.JAVA_HOME } : {}),
    };
    await execute(
      "javac",
      ["-proc:none", "--release", "23", "-d", classes, sourcePath],
      { env, timeout: 30000, maxBuffer: 65536 },
    );
    if (
      JSON.stringify((await readdir(classes)).sort()) !==
      JSON.stringify(CLASS_NAMES)
    )
      fail(true);
    const hashes = {};
    for (const name of CLASS_NAMES) {
      const path = join(classes, name),
        stat = await lstat(path);
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        stat.size < 8 ||
        stat.size > MAX_CLASS_BYTES
      )
        fail(true);
      const bytes = await readFile(path);
      if (bytes.readUInt32BE(0) !== 0xcafebabe || bytes.readUInt16BE(6) !== 67)
        fail(true);
      hashes[`classes/${name}`] = sha(bytes);
      await chmod(path, 0o444);
    }
    await chmod(classes, 0o555);
    const metadata = {
      format: "toonlira-isolation-image-1",
      dockerPlatform: "linux/amd64",
      baseImage: BASE_IMAGE,
      sourceSha256: options["source-sha256"],
      javaRelease: 23,
      runtimeMajor: 25,
      classCount: CLASS_NAMES.length,
      files: { ...hashes },
      securityApproved: false,
      published: false,
      status: "prepared-not-built",
    };
    const ignore =
      "*\n!Dockerfile\n!.dockerignore\n!image-inputs.json\n!classes/\n" +
      CLASS_NAMES.map((name) => `!classes/${name}\n`).join("");
    for (const [name, bytes] of Object.entries({
      Dockerfile: Buffer.from(dockerfile),
      ".dockerignore": Buffer.from(ignore),
      "image-inputs.json": Buffer.from(
        JSON.stringify(metadata, null, 2) + "\n",
      ),
    })) {
      await writeFile(join(image, name), bytes, { flag: "wx", mode: 0o444 });
      hashes[name] = sha(bytes);
    }
    const context = createHash("sha256");
    for (const name of Object.keys(hashes).sort())
      context.update(name).update("\0").update(hashes[name]).update("\0");
    return { ...metadata, files: hashes, contextSha256: context.digest("hex") };
  } catch {
    fail(reserved);
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    process.stdout.write(
      JSON.stringify(
        await prepareIsolationImage(
          parseIsolationImageOptions(process.argv.slice(2)),
        ),
      ) + "\n",
    );
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
