/*
 * chiaro-frame — the minimal baked-frame contract probe for tessera's quilt.
 *
 * THE CONTRACT: renderFrame(seed) is a pure, integer-only function. Same seed
 * in → byte-identical canonical string + FNV-1a hash out, on every ECMAScript
 * runtime (node, chromium, firefox, quickjs). No floats cross an
 * implementation-defined boundary: the field is built from +, -, *, %, ^,
 * >>>, |0 and Math.imul — every op is spec-pinned. Rounding-free by
 * construction, so the quilt contract ("this baked frame IS this hash")
 * holds anywhere a JS engine runs.
 *
 * Frame: fixed 80x24 char grid, classic ramp ' .:-=+*#%@@' (verbatim from
 * chiaroscuro studio.html RAMP_SETS.classic). Ink density 0 (space) → 100 ('@')
 * comes from three integer fields: concentric rings, a diagonal sweep, and a
 * seeded xorshift32 speckle.
 *
 * Hash: FNV-1a 32-bit over the hand-rolled UTF-8 bytes of the canonical
 * string. The canonical string carries version + dims + ramp + seed on its
 * header line, so a hash binds the whole contract, not just the pixels.
 *
 * Isomorphic: CommonJS in node, window.ChiaroFrame in the browser.
 * (Same UMD shape as engine.js in this directory — the heavyweight chiaroscuro
 * port this probe would wrap in production.)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChiaroFrame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = 'CHIARO-FRAME/1';
  var COLS = 80;
  var ROWS = 24;
  var RAMP = ' .:-=+*#%@@'; // chiaroscuro RAMP_SETS.classic, verbatim
  var DEFAULT_SEED = 0x5eed;

  // xorshift32 — integer-only PRNG. Every operator is spec-defined for any
  // JS engine (bitwise ops coerce via ToUint32/ToInt32 deterministically).
  function xorshift32(s) {
    s = s >>> 0;
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s;
  }

  // Ink density 0..100 for cell (x, y). Integer-only, no rounding hazards:
  //   rings: squared distance from grid center (dy doubled for 2:1 cells) / 24
  //   sweep: diagonal gradient mod 53
  //   noise: seeded xorshift32 speckle mod 29
  function cellLum(x, y, seed) {
    var dx = x - (COLS >> 1);
    var dy = (y - (ROWS >> 1)) * 2;
    var rings = ((dx * dx + dy * dy) / 24) | 0;
    var sweep = (x * 3 + y * 7) % 53;
    var h = (seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 7, 668265263)) >>> 0;
    var noise = xorshift32(h) % 29;
    return (rings + sweep + noise) % 101; // 0..100
  }

  // Hand-rolled UTF-8 encoder — spec-pinned byte output for any string.
  // (TextEncoder would do, but hand-rolling keeps the whole contract auditable
  // and dependency-free down to the bit.)
  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.codePointAt(i);
      if (c > 0xffff) i++; // consume the low surrogate of a pair
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  // FNV-1a 32-bit, by hand: offset basis 2166136261 (0x811c9dc5), prime 16777619
  // (0x01000193). Accepts a string (UTF-8 encoded first) or a byte array.
  function fnv1a32(input) {
    var bytes = typeof input === 'string' ? utf8Bytes(input) : input;
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  // Manual zero-pad — no padStart, keep it auditable to the bit.
  function hex8(n) {
    var s = n.toString(16);
    return '00000000'.slice(s.length) + s;
  }

  // Pure render: seed → {version, cols, rows, seed, text, canonical, hash}.
  // text: ROWS lines of COLS chars, '\n'-joined. canonical: header line
  // (version + dims + ramp + seed) over the text — the hash binds the whole
  // contract. hash: FNV-1a 32-bit as 8 lowercase hex chars.
  function renderFrame(seed) {
    if (seed === undefined) seed = DEFAULT_SEED;
    seed = seed >>> 0;
    var rows = [];
    for (var y = 0; y < ROWS; y++) {
      var line = '';
      for (var x = 0; x < COLS; x++) {
        var lum = cellLum(x, y, seed);
        line += RAMP[((lum * (RAMP.length - 1) / 100) | 0)];
      }
      rows.push(line);
    }
    var text = rows.join('\n');
    var canonical =
      VERSION + '\n' +
      COLS + 'x' + ROWS + ' ramp=classic seed=0x' + seed.toString(16) + '\n' +
      text;
    return {
      version: VERSION,
      cols: COLS,
      rows: ROWS,
      seed: seed,
      text: text,
      canonical: canonical,
      hash: hex8(fnv1a32(canonical))
    };
  }

  return {
    VERSION: VERSION,
    COLS: COLS,
    ROWS: ROWS,
    RAMP: RAMP,
    DEFAULT_SEED: DEFAULT_SEED,
    renderFrame: renderFrame,
    fnv1a32: fnv1a32,
    utf8Bytes: utf8Bytes,
    xorshift32: xorshift32
  };
});
