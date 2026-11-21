export const FILTER_PATTERNS = Object.freeze([
  "^opt/java/openjdk$",
  "^opt/java/openjdk/?*",
  "^__cacert_entrypoint.sh$",
  "^tmp/?*",
  "^var/lib/apt/lists/?*",
  "^var/cache/apt/archives/?*",
]);
const fail = () => {
  throw new Error("single-jre-not-admitted");
};
const CONTENT_ONLY = ["tmp", "var/lib/apt/lists", "var/cache/apt/archives"];
const MAX_ENTRIES = 100000;

function canonical(value) {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 4096 ||
    /[\x00-\x1f\x7f]/.test(value)
  )
    fail();
  let p = value.startsWith("./") ? value.slice(2) : value;
  if (p.endsWith("/")) p = p.slice(0, -1);
  if ((p === "" && value === "./") || p === ".") return ".";
  if (
    p.startsWith("/") ||
    p.split("/").some((part) => !part || part === "." || part === "..")
  )
    fail();
  return p;
}
export { canonical as canonicalArchivePath };
export function excluded(value) {
  const p = canonical(value);
  return (
    p === "__cacert_entrypoint.sh" ||
    p === "opt/java/openjdk" ||
    p.startsWith("opt/java/openjdk/") ||
    CONTENT_ONLY.some((prefix) => p.startsWith(prefix + "/"))
  );
}
function entries(values) {
  if (!Array.isArray(values) || values.length > MAX_ENTRIES) fail();
  const set = new Set();
  for (const value of values) {
    const p = canonical(value);
    if (set.has(p)) fail();
    set.add(p);
  }
  return set;
}
export function verifyEntries(beforeValues, afterValues, arch) {
  if (!["arm64", "amd64"].includes(arch)) fail();
  const before = entries(beforeValues),
    after = entries(afterValues);
  const expected = [...before].filter((p) => !excluded(p));
  if (
    expected.length === before.size ||
    expected.length !== after.size ||
    expected.some((p) => !after.has(p))
  )
    fail();
  for (const required of [
    "usr/lib/jvm/java-25-openjdk-" + arch + "/bin/java",
    "etc/ssl/certs/java/cacerts",
    "var/lib/dpkg/status",
  ])
    if (!after.has(required)) fail();
  return { retained: after.size, removed: before.size - after.size };
}
export function verifyHardlinks(beforeText, afterText) {
  function parse(text) {
    if (typeof text !== "string" || Buffer.byteLength(text) > 32 * 1024 * 1024)
      fail();
    const links = new Map();
    for (const line of text
      .split("\n")
      .filter((value) => value.startsWith("h"))) {
      const match = line.match(
        /^h\S+\s+\d+\s+\S+\s+\S+\s+\d+\s+\S+\s+\d+\s+\S+\s+(.+) link to (.+)$/,
      );
      if (!match) fail();
      const path = canonical(match[1]),
        target = canonical(match[2]);
      if (links.has(path) || links.size >= 1024) fail();
      links.set(path, target);
    }
    return links;
  }
  const before = parse(beforeText),
    after = parse(afterText);
  const expected = [...before].filter(([path]) => !excluded(path));
  if (
    after.size !== expected.length ||
    expected.some(([path, target]) => after.get(path) !== target)
  )
    fail();
  return before;
}
function decodeMtreePath(encoded) {
  try {
    const parts = encoded
      .split(/(\\[0-7]{3})/g)
      .map((part) =>
        /^\\[0-7]{3}$/.test(part)
          ? Buffer.from([parseInt(part.slice(1), 8)])
          : Buffer.from(part, "utf8"),
      );
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(parts),
    );
  } catch {
    fail();
  }
}
function mtree(text, hardlinks) {
  if (typeof text !== "string" || Buffer.byteLength(text) > 32 * 1024 * 1024)
    fail();
  const result = new Map();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [encoded, ...tokens] = line.split(/\s+/);
    if (encoded.startsWith("/")) fail();
    const path = canonical(decodeMtreePath(encoded));
    const fields = {};
    for (const token of tokens) {
      const i = token.indexOf("=");
      if (i < 1 || Object.hasOwn(fields, token.slice(0, i))) fail();
      fields[token.slice(0, i)] = token.slice(i + 1);
    }
    if (
      !["file", "dir", "link", "char", "block", "fifo", "socket"].includes(
        fields.type,
      ) ||
      !/^\d+$/.test(fields.uid ?? "") ||
      !/^\d+$/.test(fields.gid ?? "") ||
      !/^[0-7]+$/.test(fields.mode ?? "") ||
      result.has(path) ||
      result.size >= MAX_ENTRIES
    )
      fail();
    if (
      fields.type === "file" &&
      (!/^\d+$/.test(fields.size ?? "") ||
        (!/^[a-f0-9]{64}$/.test(fields.sha256digest ?? "") &&
          !(
            fields.size === "0" &&
            hardlinks.has(path) &&
            fields.sha256digest === undefined
          )))
    )
      fail();
    if (fields.type === "link" && !fields.link) fail();
    result.set(
      path,
      JSON.stringify(
        Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
  }
  for (const [path, attrs] of result) {
    const fields = Object.fromEntries(JSON.parse(attrs));
    if (fields.type !== "file" || fields.sha256digest) continue;
    let target = path;
    const visited = new Set();
    for (;;) {
      if (visited.has(target) || visited.size > 64 || !result.has(target))
        fail();
      visited.add(target);
      const value = Object.fromEntries(JSON.parse(result.get(target)));
      if (value.type !== "file") fail();
      if (value.sha256digest) break;
      target = canonical(hardlinks.get(target));
    }
  }
  return result;
}
export function verifyMtree(beforeText, afterText, hardlinks = new Map()) {
  const before = mtree(beforeText, hardlinks),
    after = mtree(afterText, hardlinks);
  let removed = 0;
  for (const [path, attrs] of before) {
    if (excluded(path)) {
      if (after.has(path)) fail();
      removed++;
    } else if (after.get(path) !== attrs) fail();
  }
  if (removed === 0 || after.size + removed !== before.size) fail();
  return { retained: after.size, removed };
}

/** Checks captured listings/mtree, not xattrs, ACLs or live daemon state. */
export function verifyRootfsRecords(records, arch) {
  const before = records.beforeEntries.trimEnd().split("\n");
  const after = records.afterEntries.trimEnd().split("\n");
  const entryProof = verifyEntries(before, after, arch);
  const links = verifyHardlinks(records.beforeVerbose, records.afterVerbose);
  const contentProof = verifyMtree(
    records.beforeMtree,
    records.afterMtree,
    links,
  );
  for (const [listing, text] of [
    [before, records.beforeMtree],
    [after, records.afterMtree],
  ]) {
    const paths = entries(listing),
      metadata = mtree(text, links);
    if (
      paths.size !== metadata.size ||
      [...paths].some((path) => !metadata.has(path))
    )
      fail();
  }
  return { entryProof, contentProof };
}
