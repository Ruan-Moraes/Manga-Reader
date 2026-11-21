import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalArchivePath,
  excluded,
  verifyEntries,
} from "./single-jre-policy.mjs";

const BLOCK_BYTES = 512;
const BUFFER_BYTES = 65536;
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_PAX_BYTES = 1024 * 1024;
const MAX_METADATA_BYTES = 16 * 1024 * 1024;
const MAX_ENTRIES = 10000;
const HASH = /^[a-f0-9]{64}$/;
const TYPES = new Set(["0", "1", "2", "3", "4", "5", "6", "x"]);
const CORE_PAX = new Set([
  "path",
  "linkpath",
  "size",
  "uid",
  "gid",
  "mtime",
  "atime",
  "ctime",
  "uname",
  "gname",
  "hdrcharset",
]);
const fail = () => {
  throw new Error("rootfs-audit-unavailable");
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const utf8 = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
const securityKey = (key) =>
  key.startsWith("SCHILY.xattr.") ||
  key.startsWith("LIBARCHIVE.xattr.") ||
  key.startsWith("SCHILY.acl.") ||
  key === "SCHILY.fflags";

function textField(block, start, length) {
  const field = block.subarray(start, start + length),
    end = field.indexOf(0);
  if (end >= 0 && field.subarray(end).some((byte) => byte !== 0)) fail();
  return utf8(end < 0 ? field : field.subarray(0, end));
}
function numberField(block, start, length) {
  const bytes = block.subarray(start, start + length);
  if (
    bytes.some((byte) => byte !== 0 && byte !== 32 && (byte < 48 || byte > 55))
  )
    fail();
  const text = bytes.toString("ascii").replace(/\0/g, " ").trim();
  if (text && !/^[0-7]+$/.test(text)) fail();
  const value = text ? parseInt(text, 8) : 0;
  if (!Number.isSafeInteger(value) || value < 0) fail();
  return value;
}
function decimal(bytes) {
  const text = utf8(bytes);
  if (!/^(?:0|[1-9][0-9]*)$/.test(text) || !Number.isSafeInteger(Number(text)))
    fail();
  return Number(text);
}
function timestamp(bytes) {
  const text = utf8(bytes);
  if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,9})?$/.test(text)) fail();
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}
function header(block) {
  if (block.subarray(257, 265).toString("hex") !== "7573746172003030") fail();
  const expected = numberField(block, 148, 8);
  let checksum = 0;
  for (let i = 0; i < BLOCK_BYTES; i++)
    checksum += i >= 148 && i < 156 ? 32 : block[i];
  if (checksum !== expected) fail();
  const type = block[156] === 0 ? "0" : String.fromCharCode(block[156]);
  if (!TYPES.has(type)) fail();
  const prefix = textField(block, 345, 155),
    name = textField(block, 0, 100);
  return {
    path: prefix ? prefix + "/" + name : name,
    type,
    mode: numberField(block, 100, 8),
    uid: numberField(block, 108, 8),
    gid: numberField(block, 116, 8),
    size: numberField(block, 124, 12),
    mtime: String(numberField(block, 136, 12)),
    link: textField(block, 157, 100),
    uname: textField(block, 265, 32),
    gname: textField(block, 297, 32),
    major: numberField(block, 329, 8),
    minor: numberField(block, 337, 8),
  };
}

function paxRecords(bytes) {
  const fields = new Map();
  let position = 0;
  while (position < bytes.length) {
    const space = bytes.indexOf(32, position);
    if (space < position + 1 || space - position > 7) fail();
    const length = decimal(bytes.subarray(position, space)),
      end = position + length;
    const equals = bytes.indexOf(61, space + 1);
    if (
      length < 5 ||
      end > bytes.length ||
      equals <= space + 1 ||
      equals >= end - 1 ||
      bytes[end - 1] !== 10
    )
      fail();
    const key = utf8(bytes.subarray(space + 1, equals));
    if (
      !/^[A-Za-z0-9_.%-]{1,256}$/.test(key) ||
      fields.has(key) ||
      !(CORE_PAX.has(key) || securityKey(key))
    )
      fail();
    const value = bytes.subarray(equals + 1, end - 1);
    if (!value.length || (key === "hdrcharset" && utf8(value) !== "UTF-8"))
      fail();
    fields.set(key, Buffer.from(value));
    position = end;
    if (fields.size > 256) fail();
  }
  return fields;
}

async function scanArchive(path, expected, sink) {
  if (
    typeof path !== "string" ||
    !isAbsolute(path) ||
    resolve(path) !== path ||
    !HASH.test(expected)
  )
    fail();
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.mode & 0o222 ||
    stat.size < 1024 ||
    stat.size > MAX_ARCHIVE_BYTES ||
    stat.size % BLOCK_BYTES ||
    (await realpath(path)) !== path
  )
    fail();
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    if (
      opened.ino !== stat.ino ||
      opened.dev !== stat.dev ||
      opened.size !== stat.size ||
      opened.mode & 0o222
    )
      fail();
    const archiveHash = createHash("sha256"),
      entries = new Map(),
      keys = {};
    let position = 0,
      metadataBytes = 0,
      pending = new Map(),
      paxHeaders = 0,
      securityMetadataEntries = 0;
    let preamble = [],
      preambleBytes = 0,
      emit = false;
    async function read(size) {
      if (
        !Number.isSafeInteger(size) ||
        size < 0 ||
        size > MAX_PAX_BYTES ||
        position + size > stat.size
      )
        fail();
      const bytes = Buffer.alloc(size);
      let done = 0;
      while (done < size) {
        const result = await handle.read(
          bytes,
          done,
          size - done,
          position + done,
        );
        if (!result.bytesRead) fail();
        done += result.bytesRead;
      }
      archiveHash.update(bytes);
      position += size;
      return bytes;
    }
    async function body(size, collect) {
      if (
        !Number.isSafeInteger(size) ||
        size < 0 ||
        position + size > stat.size ||
        (collect && size > MAX_PAX_BYTES)
      )
        fail();
      const hash = createHash("sha256"),
        chunks = [];
      let remaining = size;
      while (remaining) {
        const bytes = await read(Math.min(remaining, BUFFER_BYTES));
        hash.update(bytes);
        if (sink && emit) await sink(bytes);
        if (collect) chunks.push(bytes);
        remaining -= bytes.length;
      }
      const padding = await read(
        (BLOCK_BYTES - (size % BLOCK_BYTES)) % BLOCK_BYTES,
      );
      if (padding.some((byte) => byte !== 0)) fail();
      if (sink && emit) await sink(padding);
      return collect ? Buffer.concat(chunks) : hash.digest("hex");
    }
    let ended = false;
    while (position < stat.size) {
      const block = await read(BLOCK_BYTES);
      if (block.every((byte) => byte === 0)) {
        if (
          pending.size ||
          position + BLOCK_BYTES > stat.size ||
          (await read(BLOCK_BYTES)).some((byte) => byte !== 0)
        )
          fail();
        while (position < stat.size)
          if (
            (await read(Math.min(BUFFER_BYTES, stat.size - position))).some(
              (byte) => byte !== 0,
            )
          )
            fail();
        ended = true;
        break;
      }
      const entry = header(block);
      if (entry.type === "x") {
        if (entry.size < 1) fail();
        if (++paxHeaders > MAX_ENTRIES) fail();
        emit = false;
        const bytes = await body(entry.size, true);
        const fields = paxRecords(bytes);
        if (sink) {
          preambleBytes +=
            BLOCK_BYTES + Math.ceil(entry.size / BLOCK_BYTES) * BLOCK_BYTES;
          if (preambleBytes > MAX_PAX_BYTES) fail();
          preamble.push(
            block,
            bytes,
            Buffer.alloc(
              (BLOCK_BYTES - (entry.size % BLOCK_BYTES)) % BLOCK_BYTES,
            ),
          );
        }
        for (const [key, value] of fields) {
          if (pending.has(key)) fail();
          pending.set(key, value);
          keys[key] = (keys[key] ?? 0) + 1;
          metadataBytes += key.length + value.length;
        }
        if (metadataBytes > MAX_METADATA_BYTES) fail();
        continue;
      }
      for (const key of ["path", "linkpath", "uname", "gname"])
        if (pending.has(key))
          entry[key === "linkpath" ? "link" : key] = utf8(pending.get(key));
      for (const key of ["uid", "gid", "size"])
        if (pending.has(key)) entry[key] = decimal(pending.get(key));
      if (pending.has("mtime")) entry.mtime = timestamp(pending.get("mtime"));
      entry.path = canonicalArchivePath(entry.path);
      if (
        entries.has(entry.path) ||
        entries.size >= MAX_ENTRIES ||
        (entry.type !== "0" && entry.size !== 0)
      )
        fail();
      if (entry.type === "1") entry.link = canonicalArchivePath(entry.link);
      if (
        ["1", "2"].includes(entry.type) &&
        (!entry.link ||
          Buffer.byteLength(entry.link) > 4096 ||
          /[\x00-\x1f\x7f]/.test(entry.link))
      )
        fail();
      entry.extended = Object.fromEntries(
        [...pending]
          .filter(
            ([key]) =>
              ![
                "path",
                "linkpath",
                "size",
                "uid",
                "gid",
                "mtime",
                "uname",
                "gname",
                "hdrcharset",
              ].includes(key),
          )
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, value]) => [key, digest(value)]),
      );
      if ([...pending.keys()].some(securityKey)) securityMetadataEntries++;
      emit = !excluded(entry.path);
      if (sink && emit) {
        for (const bytes of preamble) await sink(bytes);
        await sink(block);
      }
      preamble = [];
      preambleBytes = 0;
      entry.contentSha256 = await body(entry.size, false);
      pending = new Map();
      const encoded = JSON.stringify(entry);
      metadataBytes += Buffer.byteLength(encoded);
      if (metadataBytes > MAX_METADATA_BYTES) fail();
      entries.set(entry.path, entry);
    }
    if (!ended || archiveHash.digest("hex") !== expected) fail();
    const extra = Buffer.alloc(1);
    if ((await handle.read(extra, 0, 1, stat.size)).bytesRead) fail();
    const final = await handle.stat();
    if (
      final.size !== stat.size ||
      final.mtimeMs !== stat.mtimeMs ||
      final.ctimeMs !== stat.ctimeMs
    )
      fail();
    let hardlinks = 0;
    for (const entry of entries.values())
      if (entry.type === "1") {
        hardlinks++;
        let current = entry;
        const visited = new Set();
        while (current.type === "1") {
          if (
            visited.has(current.path) ||
            visited.size > 64 ||
            !entries.has(current.link)
          )
            fail();
          visited.add(current.path);
          current = entries.get(current.link);
        }
        if (current.type !== "0") fail();
      }
    const snapshot = createHash("sha256");
    for (const path of [...entries.keys()].sort())
      snapshot
        .update(path)
        .update("\0")
        .update(JSON.stringify(entries.get(path)))
        .update("\0");
    return {
      entries,
      summary: {
        sha256: expected,
        bytes: stat.size,
        entries: entries.size,
        paxHeaders,
        paxKeys: keys,
        hardlinks,
        securityMetadataEntries,
        metadataSha256: snapshot.digest("hex"),
      },
    };
  } finally {
    await handle.close();
  }
}

/** Bounded literal paths for a separate, caller-authorized filesystem probe; no payloads or extraction. */
export async function readRootfsPathInventory(options) {
  try {
    if (!options || Object.keys(options).sort().join(",") !== "path,sha256")
      fail();
    const archive = await scanArchive(options.path, options.sha256);
    return Object.freeze({
      paths: Object.freeze([...archive.entries.keys()].sort()),
      summary: Object.freeze(archive.summary),
    });
  } catch {
    fail();
  }
}

/** Copies retained header/PAX/payload bytes unchanged. No interpreter, extraction or Unicode rewriting. */
export async function filterRootfsArchive(options) {
  let reserved = false,
    output;
  try {
    options = { ...options };
    if (
      !options ||
      Object.keys(options).sort().join(",") !==
        "architecture,destination,source,sourceSha256" ||
      !["arm64", "amd64"].includes(options.architecture) ||
      !HASH.test(options.sourceSha256) ||
      typeof options.destination !== "string" ||
      !isAbsolute(options.destination) ||
      resolve(options.destination) !== options.destination ||
      (await realpath(dirname(options.destination))) !==
        dirname(options.destination)
    )
      fail();
    await mkdir(options.destination, { mode: 0o700 });
    reserved = true;
    const path = join(options.destination, "rootfs.tar");
    output = await open(path, "wx", 0o600);
    const hash = createHash("sha256");
    let rootfsBytes = 0;
    async function copy(bytes) {
      let offset = 0;
      while (offset < bytes.length) {
        const result = await output.write(bytes, offset, bytes.length - offset);
        if (!result.bytesWritten) fail();
        offset += result.bytesWritten;
      }
      rootfsBytes += bytes.length;
      if (rootfsBytes > MAX_ARCHIVE_BYTES) fail();
      hash.update(bytes);
    }
    await scanArchive(options.source, options.sourceSha256, copy);
    await copy(Buffer.alloc(2 * BLOCK_BYTES));
    await output.sync();
    await output.close();
    output = null;
    await chmod(path, 0o444);
    const rootfsSha256 = hash.digest("hex");
    const audit = await auditRootfsArchives({
      before: options.source,
      beforeSha256: options.sourceSha256,
      after: path,
      afterSha256: rootfsSha256,
      architecture: options.architecture,
    });
    const result = {
      format: "toonlira-rootfs-stream-filter-1",
      architecture: options.architecture,
      rootfsSha256,
      rootfsBytes,
      audit,
      status: "filtered-archive-verified-not-operational",
      securityApproved: false,
    };
    await writeFile(
      join(options.destination, "filter.json"),
      JSON.stringify(result, null, 2) + "\n",
      { flag: "wx", mode: 0o400 },
    );
    return result;
  } catch {
    throw new Error(
      reserved ? "rootfs-filter-incomplete" : "rootfs-audit-unavailable",
    );
  } finally {
    await output?.close().catch(() => {});
  }
}

/** Reads the pinned archives themselves. Does not extract, execute or certify source filesystem attributes. */
export async function auditRootfsArchives(options) {
  try {
    options = { ...options };
    if (
      !options ||
      Object.keys(options).sort().join(",") !==
        "after,afterSha256,architecture,before,beforeSha256" ||
      !["arm64", "amd64"].includes(options.architecture) ||
      options.before === options.after
    )
      fail();
    const before = await scanArchive(options.before, options.beforeSha256),
      after = await scanArchive(options.after, options.afterSha256);
    const count = verifyEntries(
      [...before.entries.keys()],
      [...after.entries.keys()],
      options.architecture,
    );
    for (const [path, entry] of before.entries)
      if (
        !excluded(path) &&
        JSON.stringify(after.entries.get(path)) !== JSON.stringify(entry)
      )
        fail();
    return {
      format: "toonlira-rootfs-archive-audit-1",
      architecture: options.architecture,
      ...count,
      before: before.summary,
      after: after.summary,
      status: "archive-equivalence-verified-not-operational",
      filesystemMetadataVerified: false,
      securityApproved: false,
    };
  } catch {
    fail();
  }
}

async function main(args) {
  if (args[0] === "filter") {
    const names = ["source", "source-sha256", "architecture", "destination"],
      options = {};
    for (let i = 1; i < args.length; i += 2) {
      const key = args[i]?.slice(2);
      if (
        !args[i]?.startsWith("--") ||
        !names.includes(key) ||
        Object.hasOwn(options, key) ||
        !args[i + 1]
      )
        fail();
      options[key] = args[i + 1];
    }
    if (Object.keys(options).length !== names.length) fail();
    process.stdout.write(
      JSON.stringify(
        await filterRootfsArchive({
          source: options.source,
          sourceSha256: options["source-sha256"],
          architecture: options.architecture,
          destination: options.destination,
        }),
      ) + "\n",
    );
    return;
  }
  const names = [
      "before",
      "before-sha256",
      "after",
      "after-sha256",
      "architecture",
      "destination",
    ],
    options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    if (
      !args[i]?.startsWith("--") ||
      !names.includes(key) ||
      Object.hasOwn(options, key) ||
      !args[i + 1]
    )
      fail();
    options[key] = args[i + 1];
  }
  if (Object.keys(options).length !== names.length) fail();
  const destination = options.destination;
  if (
    !isAbsolute(destination) ||
    resolve(destination) !== destination ||
    (await realpath(dirname(destination))) !== dirname(destination)
  )
    fail();
  const result = await auditRootfsArchives({
    before: options.before,
    beforeSha256: options["before-sha256"],
    after: options.after,
    afterSha256: options["after-sha256"],
    architecture: options.architecture,
  });
  await mkdir(destination, { mode: 0o700 });
  await writeFile(
    join(destination, "audit.json"),
    JSON.stringify(result, null, 2) + "\n",
    { flag: "wx", mode: 0o400 },
  );
  process.stdout.write(JSON.stringify(result) + "\n");
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    await main(process.argv.slice(2));
  } catch {
    process.stderr.write("rootfs-audit-unavailable\n");
    process.exitCode = 1;
  }
}
