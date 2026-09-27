// test.ts — contract tests for the chiaro-frame seed (node side). Run: node test.ts
// Plain asserts, wal-edl house style. The SAME frame.js is exercised in the
// browser by pw-test.js; cross-runtime equality is asserted there.
const { ok, equal, deepEqual } = require("node:assert/strict");
const ChiaroFrame = require("./frame.js");

const { renderFrame, fnv1a32, utf8Bytes, RAMP, COLS, ROWS, VERSION } = ChiaroFrame;
let n = 0;
function t(name: string, fn: () => void) { fn(); n++; console.log(`  ok ${n} - ${name}`); }

console.log(`# ${VERSION} — node contract tests`);

// --- 1) FNV-1a known-answer vectors (published 32-bit reference values) ---
t("fnv1a32('') = offset basis", () => equal(fnv1a32("").toString(16), "811c9dc5"));
t("fnv1a32('a') = e40c292c (published vector)", () => equal(fnv1a32("a").toString(16), "e40c292c"));
t("fnv1a32('hello') = 4f9f2cab (published vector)", () => equal(fnv1a32("hello").toString(16), "4f9f2cab"));

// --- 2) hand-rolled UTF-8 encoder: spec-pinned byte sequences ---
t("utf8 é -> C3 A9", () => deepEqual(utf8Bytes("é"), [0xc3, 0xa9]));
t("utf8 ▓ (U+2593) -> E2 96 93", () => deepEqual(utf8Bytes("▓"), [0xe2, 0x96, 0x93]));
t("utf8 █ (U+2588) -> E2 96 88", () => deepEqual(utf8Bytes("█"), [0xe2, 0x96, 0x88]));
t("utf8 𝕏 (U+1D54F, surrogate pair) -> F0 9D 95 8F", () => deepEqual(utf8Bytes("𝕏"), [0xf0, 0x9d, 0x95, 0x8f]));

// --- 3) determinism: same seed, twice, byte-identical ---
const a = renderFrame();
const b = renderFrame();
t("renderFrame() twice -> identical text", () => equal(a.text, b.text));
t("renderFrame() twice -> identical hash", () => equal(a.hash, b.hash));

// --- 4) shape: exactly 24 lines x 80 chars, alphabet = ramp ---
t("grid is 24 lines", () => equal(a.text.split("\n").length, ROWS));
t("every line is 80 chars", () => ok(a.text.split("\n").every((l: string) => l.length === COLS)));
t("every char is in the classic ramp", () =>
  ok(a.text.split("\n").every((line: string) =>
    line.split("").every((ch: string) => RAMP.includes(ch)))));

// --- 5) the field is not degenerate: at least 6 distinct ramp glyphs ---
t("field exercises >= 6 ramp glyphs", () => {
  const used = new Set(a.text.split("\n").join("").split(""));
  ok(used.size >= 6, `only ${used.size} distinct glyphs: ${[...used].join("")}`);
});

// --- 6) seed sensitivity: different seeds -> different hashes ---
t("seed 1 vs 2 -> different hashes", () => ok(renderFrame(1).hash !== renderFrame(2).hash));
t("explicit default seed matches implicit", () => equal(renderFrame(0x5eed).hash, a.hash));

// --- 7) canonical string binds version+dims+ramp+seed over the text ---
t("canonical starts with version header", () => ok(a.canonical.startsWith(VERSION + "\n")));
t("canonical contains seed header", () => ok(a.canonical.includes("80x24 ramp=classic seed=0x5eed\n")));
t("canonical ends with the text", () => ok(a.canonical.endsWith(a.text)));

// --- 8) hash of the canonical string, recomputed independently ---
t("hash == fnv1a32(canonical) recomputed", () => equal(a.hash, fnv1a32(a.canonical).toString(16).padStart(8, "0")));

const nodeHash = a.hash;
console.log(`\nALL ${n} TESTS PASSED`);
console.log(`node frame hash: ${nodeHash}`);
