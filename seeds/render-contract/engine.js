/*
 * chiaro-engine — deterministic glyph-core extraction from chiaroscuro.
 *
 * Provenance: SuperInstance/chiaroscuro@1c79f1e (studio.html, GLYPH engine,
 * the v2 bivariate tone/edge/braille core).
 *
 * THE CONTRACT: renderFrame(srcRgba, srcW, srcH, preset, cols) is a pure
 * function. Same bytes in → same exact text + ink out. No Math.random, no
 * DOM, no canvas, no state. Text choice is a function of
 * (source pixels, preset, ENGINE_VERSION) and nothing else.
 *
 * Deliberate deviation from studio.html: the browser pipeline downsamples
 * via ctx.drawImage (bilinear — implementation-defined across browsers,
 * which is precisely the decoder nondeterminism the Skeptic's audit
 * targets). Here downsampling is an integer box average, portable by
 * construction. Stateful/random paths (trail, smooth, jitter, glitch,
 * grain) are paint-side and excluded from contract scope; presets pin
 * them to 0. The 'match' engine (font-raster dependent) is out of scope.
 *
 * Isomorphic: CommonJS in node, window.ChiaroEngine in the browser.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChiaroEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ENGINE_VERSION = 'glyph/1.0.0+chiaroscuro@1c79f1e';
  var SOURCE_GEN_VERSION = 'synthetic/1.0.0';

  // RAMP_SETS: verbatim from studio.html (DEFS.engine ramp options)
  var RAMP_SETS = {
    classic: ' .:-=+*#%@@',
    fine: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    blocks: ' ░▒▓█',
    minimal: ' .:*#',
    stars: '·∴∗✦✱✳❋█',
    runes: '·ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ█',
    binary: ' 01',
    code: ' {}[]()<>/\\|=+*',
    waves: '·≈≋▒▓█',
    custom: ''
  };

  function hsl2rgb(h, s, l) {
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  function hexRgb(hx) { var n = parseInt(hx.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  function cellColor(P, r, g, b, L) {
    var sat = P.sat / 100, gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sat; g = gray + (g - gray) * sat; b = gray + (b - gray) * sat;
    if (P.temp) { var t = P.temp * 0.35; r = Math.min(255, r + t); b = Math.max(0, b - t); }
    switch (P.colMode) {
      case 'phosphor': return hsl2rgb(P.hue, Math.min(100, sat * 80), Math.min(92, L * 0.85 + 4));
      case 'duotone': {
        var a = hexRgb(P.shadowCol), c = hexRgb(P.highCol), t2 = Math.max(0, Math.min(1, L / 255));
        return [a[0] + (c[0] - a[0]) * t2, a[1] + (c[1] - a[1]) * t2, a[2] + (c[2] - a[2]) * t2];
      }
      case 'heatmap': return hsl2rgb((300 - L / 255 * 300 + 360) % 360, 85, Math.min(70, 20 + L * 0.22));
      case 'ink': { var v = 255 - L; return [v, v, v]; }
      default: return [r, g, b];
    }
  }

  function activeRamp(P) {
    if (P.ramp === 'custom' && P.rampCustom) return P.rampCustom;
    return RAMP_SETS[P.ramp] || RAMP_SETS.classic;
  }

  var BAYER = [0, 2, 3, 1];
  var DIRS = [['·', '─', '━', '═', '█'], ['·', '╱', '╱', '▚', '▓'], ['·', '│', '┃', '║', '█'], ['·', '╲', '╲', '▞', '▓']];
  var BMAP = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20, 0x40, 0x80];
  var BX = [0, 0, 0, 0, 1, 1, 1, 1], BY = [0, 1, 2, 3, 0, 1, 2, 3];

  /*
   * src: Uint8ClampedArray RGBA, sw×sh.
   * preset: the glyph-engine subset (engine:'glyph' assumed; zoom must be 100).
   * cols: grid width in cells. rows derived from source aspect (studio formula).
   * returns {cols, rows, text, ink} — text is rows joined by '\n' (' ' = no glyph),
   * ink is ';'-joined 'ch|r|g|b' records for emitted cells (clamped ints, studio emit math).
   */
  function renderFrame(src, sw, sh, preset, cols) {
    var P = preset;
    if (P.zoom !== 100) throw new Error('contract scope: zoom must be 100 (got ' + P.zoom + ')');
    if (P.engine !== 'glyph') throw new Error('contract scope: engine must be glyph (got ' + P.engine + ')');

    var aspect = sw / sh;
    var rows = Math.max(2, Math.floor(cols / aspect));
    var n = cols * rows;

    // --- downsample: integer box average (portable replacement for drawImage) ---
    var px = new Float64Array(n * 3);
    for (var y = 0; y < rows; y++) {
      var y0 = Math.floor(y * sh / rows), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sh / rows));
      for (var x = 0; x < cols; x++) {
        var gx = P.mirror ? cols - 1 - x : x;
        var x0 = Math.floor(gx * sw / cols), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * sw / cols));
        var sr = 0, sg = 0, sb = 0, cnt = 0;
        for (var yy = y0; yy < y1; yy++) {
          var rowOff = yy * sw;
          for (var xx = x0; xx < x1; xx++) {
            var p4 = (rowOff + xx) * 4;
            sr += src[p4]; sg += src[p4 + 1]; sb += src[p4 + 2]; cnt++;
          }
        }
        var pi = (y * cols + x) * 3;
        px[pi] = sr / cnt; px[pi + 1] = sg / cnt; px[pi + 2] = sb / cnt;
      }
    }

    // --- luminance field: verbatim studio math ---
    var lum = new Float64Array(n);
    var con = P.contrast / 25, bri = P.brightness * 2.2, gam = P.gamma / 100;
    var kale = P.kaleido | 0;
    for (var ly = 0; ly < rows; ly++) {
      for (var lx = 0; lx < cols; lx++) {
        var sx = lx, sy = ly;
        if (kale >= 2 && sx >= cols / 2) sx = cols - 1 - sx;
        if (kale >= 4 && sy >= rows / 2) sy = rows - 1 - sy;
        var i = ly * cols + lx, s = (sy | 0) * cols + (sx | 0), pp = s * 3;
        var L = (0.299 * px[pp] + 0.587 * px[pp + 1] + 0.114 * px[pp + 2]) / 255;
        L = Math.max(0, Math.min(1, (L - 0.5) * con + 0.5 + bri / 2550));
        L = Math.pow(Math.max(0, Math.min(1, L)), gam);
        L = Math.max(0, Math.min(1, (L * 255 - P.blackPt) / Math.max(1, P.whitePt - P.blackPt)));
        if (P.invert) L = 1 - L;
        if (P.posterize > 1) L = Math.round(L * (P.posterize - 1)) / (P.posterize - 1);
        lum[i] = L * 255;
      }
    }
    if (P.dither > 0) {
      var amt = P.dither * 0.9;
      for (var dy = 0; dy < rows; dy++) for (var dx = 0; dx < cols; dx++)
        lum[dy * cols + dx] += (BAYER[(dy & 1) * 2 + (dx & 1)] / 4 - 0.5) * amt;
    }

    // --- glyph selection: verbatim studio bivariate core ---
    var ramp = activeRamp(P), rl = ramp.length;
    var lxa = Math.cos(P.lightAngle * Math.PI / 180), lya = Math.sin(P.lightAngle * Math.PI / 180);
    var relief = P.relief / 100, edgeMix = P.edgeAmt / 100, toneMix = P.toneAmt / 100, brMix = P.brailleAmt / 100;

    var textRows = [];
    var inkParts = [];
    for (var gy = 0; gy < rows; gy++) {
      var line = '';
      for (var gxx = 0; gxx < cols; gxx++) {
        var gi = gy * cols + gxx, gp = gi * 3;
        var xm = gxx > 0 ? gxx - 1 : gxx, xp = gxx < cols - 1 ? gxx + 1 : gxx;
        var ym = gy > 0 ? gy - 1 : gy, yp = gy < rows - 1 ? gy + 1 : gy;
        var Lv = lum[gi];
        var g00 = lum[ym * cols + xm], g01 = lum[ym * cols + gxx], g02 = lum[ym * cols + xp];
        var g10 = lum[gy * cols + xm], g12 = lum[gy * cols + xp];
        var g20 = lum[yp * cols + xm], g21 = lum[yp * cols + gxx], g22 = lum[yp * cols + xp];
        var gxv, gyv;
        if (P.edgeStyle === 'emboss') { gxv = g22 - g00; gyv = g20 - g02; }
        else if (P.edgeStyle === 'laplace') { gxv = g01 + g10 + g12 + g21 - 4 * Lv; gyv = 0; }
        else { gxv = (g02 + 2 * g12 + g22) - (g00 + 2 * g10 + g20); gyv = (g20 + 2 * g21 + g22) - (g00 + 2 * g01 + g02); }
        var mag = Math.sqrt(gxv * gxv + gyv * gyv) / 1020;
        var mean = (g00 + g01 + g02 + g10 + g12 + g20 + g21 + g22) / 8;
        var varr = ((g00 - mean) * (g00 - mean) + (g01 - mean) * (g01 - mean) + (g02 - mean) * (g02 - mean) + (g10 - mean) * (g10 - mean) + (g12 - mean) * (g12 - mean) + (g20 - mean) * (g20 - mean) + (g21 - mean) * (g21 - mean) + (g22 - mean) * (g22 - mean)) / 8 / 4000;
        var ch = null, cr = px[gp], cg = px[gp + 1], cb = px[gp + 2];
        if (edgeMix > 0 && mag > P.edgeThresh / 100) {
          var ang = (Math.atan2(gyv, gxv) * 180 / Math.PI + 360) % 180;
          var fam = DIRS[0];
          if (ang >= 22.5 && ang < 67.5) fam = DIRS[1];
          else if (ang >= 67.5 && ang < 112.5) fam = DIRS[2];
          else if (ang >= 112.5 && ang < 157.5) fam = DIRS[3];
          ch = fam[Math.min(4, Math.floor(mag * 9 * (P.edgeGain / 8) * (0.5 + relief)))];
          var lit = (gxv * lxa + gyv * lya) / (mag * 1020 + 1);
          var boost = relief * lit * 90;
          if (P.edgeColor === 'white') { cr = cg = cb = 255; }
          else if (P.edgeColor === 'black') { cr = cg = cb = 0; }
          else { cr += boost; cg += boost; cb += boost; }
        } else if (brMix > 0.08 && varr > (1 - brMix) * 0.4 && mag < 0.12) {
          var dots = 0;
          for (var d = 0; d < 8; d++) {
            var v = lum[Math.min(rows - 1, ym + BY[d] * Math.max(1, yp - ym) / 3 | 0) * cols + Math.min(cols - 1, gxx + BX[d])];
            if (v > mean + (0.5 - brMix) * 40) dots |= BMAP[d];
          }
          ch = dots ? String.fromCharCode(0x2800 + dots) : null;
        }
        if (!ch && toneMix > 0.05) {
          var t = Math.max(0, Math.min(0.999, Lv / 255));
          ch = ramp[Math.floor((1 - t) * (rl - 1))];
          if (ch === ' ') ch = null;
        }
        if (ch) {
          line += ch;
          var cc = cellColor(P, cr, cg, cb, Lv);
          var orr = Math.max(0, Math.min(255, cc[0])) | 0;
          var og = Math.max(0, Math.min(255, cc[1])) | 0;
          var ob = Math.max(0, Math.min(255, cc[2])) | 0;
          inkParts.push(ch + '|' + orr + ',' + og + ',' + ob);
        } else {
          line += ' ';
        }
      }
      textRows.push(line);
    }
    return { cols: cols, rows: rows, text: textRows.join('\n'), ink: inkParts.join(';') };
  }

  return {
    ENGINE_VERSION: ENGINE_VERSION,
    SOURCE_GEN_VERSION: SOURCE_GEN_VERSION,
    RAMP_SETS: RAMP_SETS,
    renderFrame: renderFrame
  };
});
