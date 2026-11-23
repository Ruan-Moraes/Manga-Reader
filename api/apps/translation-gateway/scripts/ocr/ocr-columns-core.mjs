export const ALGORITHM = "column-candidates-1";
export const DEFAULT_PARAMETERS = Object.freeze({
  centerFraction: 0.5,
  smallRatio: 0.6,
  largeGapHeights: 2.5,
  minSymbols: 2,
});
export const MAX_OUTPUT = 4 * 1024 * 1024;
const MAX_SYMBOLS = 4096;
const MAX_RELATIONS = 32768;
export const check = (condition) => {
  if (!condition) throw new Error("columns-invalid-artifact");
};
const pathCompare = (a, b) => {
  const left = a.split("/").map(Number),
    right = b.split("/").map(Number);
  for (let i = 0; i < Math.min(left.length, right.length); i++)
    if (left[i] !== right[i]) return left[i] - right[i];
  return left.length - right.length;
};
const median = (values) => {
  const sorted = values.toSorted((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length
    ? sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2
    : null;
};

export function bounds(node, diagnostic) {
  const points = node.vertices;
  if (
    !Array.isArray(points) ||
    points.length !== 4 ||
    node.normalizedVertices?.length !== 0 ||
    points.some(
      (p) =>
        !p ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.y < 0 ||
        p.x > diagnostic.widthPx ||
        p.y > diagnostic.heightPx,
    )
  )
    return null;
  const crosses = points.map((a, i) => {
    const b = points[(i + 1) % 4],
      c = points[(i + 2) % 4];
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  });
  if (!crosses.every((n) => n > 1e-8) && !crosses.every((n) => n < -1e-8))
    return null;
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

export function validateProfile(profile, diagnostic, source) {
  check(Buffer.byteLength(JSON.stringify(profile)) <= 65536);
  check(
    profile?.version === "1.0" &&
      profile.algorithmRevision === ALGORITHM &&
      profile.selectionMethod === "manual" &&
      profile.direction === "vertical-ttb-rtl",
  );
  const keys = [
    "runId",
    "diagnosticId",
    "imageSha256",
    "manifestSha256",
    "rawResponseSha256",
    "diagnosticSha256",
    "synthetic",
  ];
  check(
    profile.source &&
      Object.keys(profile.source).length === keys.length &&
      keys.every((k) => profile.source[k] === source[k]),
  );
  for (const key of keys.filter((k) => k.endsWith("Sha256")))
    check(/^[a-f0-9]{64}$/.test(source[key]));
  check(typeof source.synthetic === "boolean");
  const p = profile.parameters;
  check(
    p &&
      Object.keys(p).length === 4 &&
      Number.isFinite(p.centerFraction) &&
      p.centerFraction > 0 &&
      p.centerFraction <= 1 &&
      Number.isFinite(p.smallRatio) &&
      p.smallRatio > 0 &&
      p.smallRatio < 1 &&
      Number.isFinite(p.largeGapHeights) &&
      p.largeGapHeights > 0 &&
      p.minSymbols === 2,
  );
  check(
    Array.isArray(profile.selection) &&
      profile.selection.length > 0 &&
      profile.selection.length <= 1024,
  );
  const ids = new Set(),
    paths = new Set();
  for (const selection of profile.selection) {
    check(
      selection && !ids.has(selection.regionId) && !paths.has(selection.path),
    );
    check(
      diagnostic.nodes.some(
        (n) =>
          n.kind === "paragraph" &&
          n.path === selection.path &&
          n.regionId === selection.regionId &&
          n.disposition === "retained",
      ),
    );
    ids.add(selection.regionId);
    paths.add(selection.path);
  }
  return profile;
}

export function selectedSymbols(diagnostic, profile) {
  const prefixes = profile.selection.map((p) => p.path + "/");
  const symbols = diagnostic.nodes
    .filter(
      (n) =>
        n.kind === "symbol" &&
        prefixes.some((prefix) => n.path.startsWith(prefix)),
    )
    .toSorted((a, b) => pathCompare(a.path, b.path));
  check(
    symbols.length > 0 &&
      symbols.length <= MAX_SYMBOLS &&
      new Set(symbols.map((n) => n.path)).size === symbols.length,
  );
  check(
    symbols.every(
      (n) =>
        typeof n.text === "string" &&
        /^(0|[1-9]\d*)(\/(0|[1-9]\d*)){4}$/.test(n.path),
    ),
  );
  return symbols;
}

// Interval relations are semantic; technical IDs never resolve an ambiguous tie.
function precedence(items, before, idOf, addRelation, addAmbiguity) {
  const edges = [],
    incoming = new Map(items.map((item) => [idOf(item), 0])),
    outgoing = new Map(items.map((item) => [idOf(item), []]));
  let total = true;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      let a = items[i],
        b = items[j];
      if (before(b, a)) [a, b] = [b, a];
      else if (!before(a, b)) {
        total = false;
        addAmbiguity(idOf(a), idOf(b));
        continue;
      }
      const from = idOf(a),
        to = idOf(b);
      addRelation();
      edges.push([from, to]);
      incoming.set(to, incoming.get(to) + 1);
      outgoing.get(from).push(to);
    }
  const order = [];
  const available = [...incoming]
    .filter(([, count]) => count === 0)
    .map(([id]) => id);
  while (available.length) {
    const current = available.shift();
    order.push(current);
    for (const next of outgoing.get(current)) {
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) available.push(next);
    }
  }
  check(order.length === items.length);
  return { edges, order: total ? order : null };
}

export function groupColumns(diagnostic, profile, source) {
  validateProfile(profile, diagnostic, source);
  const symbols = selectedSymbols(diagnostic, profile),
    boxes = new Map(symbols.map((s) => [s.path, bounds(s, diagnostic)]));
  const valid = [...boxes.values()].filter(Boolean),
    width = median(valid.map((b) => b.width)),
    height = median(valid.map((b) => b.height));
  const inventory = [],
    candidates = [],
    columns = [],
    ambiguities = [];
  let relations = 0;
  const budget = () => check(++relations <= MAX_RELATIONS);
  const ambiguity = (entry) => {
    budget();
    ambiguities.push(entry);
  };
  const unresolved = (item, reason) =>
    inventory.push({ symbolId: item.path, columnId: null, reason });
  for (const symbol of symbols) {
    const box = boxes.get(symbol.path);
    if (!box) {
      unresolved(symbol, "invalid-geometry");
      continue;
    }
    if ([...symbol.text].length !== 1) {
      unresolved(symbol, "multi-character");
      continue;
    }
    if (
      box.width < width * profile.parameters.smallRatio &&
      box.height < height * profile.parameters.smallRatio
    ) {
      unresolved(symbol, "small-geometry");
      continue;
    }
    const center = (box.left + box.right) / 2,
      half = (box.width * profile.parameters.centerFraction) / 2;
    candidates.push({
      path: symbol.path,
      box,
      start: center - half,
      end: center + half,
    });
  }
  candidates.sort(
    (a, b) => a.start - b.start || a.end - b.end || pathCompare(a.path, b.path),
  );
  const components = [];
  for (const candidate of candidates) {
    const previous = components.at(-1);
    if (!previous || candidate.start > previous.end)
      components.push({ items: [candidate], end: candidate.end });
    else {
      previous.items.push(candidate);
      previous.end = Math.max(previous.end, candidate.end);
    }
  }
  for (const { items } of components) {
    const intersectionLeft = Math.max(...items.map((i) => i.start)),
      intersectionRight = Math.min(...items.map((i) => i.end));
    if (intersectionLeft > intersectionRight) {
      items.forEach((i) => unresolved(i, "transitive-bridge"));
      ambiguity({
        kind: "transitive-bridge",
        symbolIds: items.map((i) => i.path),
      });
      continue;
    }
    if (items.length < profile.parameters.minSymbols) {
      items.forEach((i) => unresolved(i, "isolated"));
      continue;
    }
    const id = `column-${columns.length}`,
      symbolIds = items.map((i) => i.path).sort(pathCompare);
    const relation = precedence(
      items,
      (a, b) => a.box.bottom <= b.box.top,
      (i) => i.path,
      budget,
      (a, b) =>
        ambiguity({
          kind: "overlapping-symbols",
          columnId: id,
          symbolIds: [a, b],
        }),
    );
    // Consecutive non-overlapping boxes in top-coordinate order: never bridge an overlap.
    const byTop = items.toSorted(
      (a, b) => a.box.top - b.box.top || pathCompare(a.path, b.path),
    );
    for (let i = 1; i < byTop.length; i++) {
      const a = byTop[i - 1],
        b = byTop[i],
        gap = b.box.top - a.box.bottom;
      if (gap > height * profile.parameters.largeGapHeights)
        ambiguity({
          kind: "large-gap",
          columnId: id,
          symbolIds: [a.path, b.path],
          gapPx: gap,
        });
    }
    columns.push({
      id,
      symbolIds,
      bounds: {
        left: Math.min(...items.map((i) => i.box.left)),
        right: Math.max(...items.map((i) => i.box.right)),
        top: Math.min(...items.map((i) => i.box.top)),
        bottom: Math.max(...items.map((i) => i.box.bottom)),
      },
      precedence: relation.edges,
      order: relation.order,
    });
    items.forEach((item) =>
      inventory.push({ symbolId: item.path, columnId: id, reason: null }),
    );
  }
  const relation = precedence(
    columns,
    (a, b) => a.bounds.left >= b.bounds.right,
    (c) => c.id,
    budget,
    (a, b) => ambiguity({ kind: "overlapping-columns", columnIds: [a, b] }),
  );
  const state = !columns.length
    ? "inconclusive"
    : inventory.some((i) => i.columnId === null) || ambiguities.length
      ? "partial"
      : "complete";
  const result = {
    columnsVersion: "1.0",
    algorithmRevision: ALGORITHM,
    source: { ...source },
    direction: profile.direction,
    parameters: { ...profile.parameters },
    state,
    scale: { medianWidth: width, medianHeight: height },
    originalOrder: symbols.map((s) => s.path),
    inventory: inventory.sort((a, b) => pathCompare(a.symbolId, b.symbolId)),
    columns,
    columnPrecedence: relation.edges,
    columnOrder: relation.order,
    ambiguities,
  };
  check(Buffer.byteLength(JSON.stringify(result)) <= MAX_OUTPUT);
  return result;
}
