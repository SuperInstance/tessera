// pw-test.js — cross-runtime byte-identity check for the chiaro-frame contract.
// Pattern lifted from chiaroscuro/tools/pw-test*.js: npx-cached playwright-core
// driving the ms-playwright headless shell, with locally-extracted nss libs.
// Asserts: browser hash === node hash, browser text === node text (byte-identical).
const path = require('path');
const { chromium } = require('/home/eileen/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');
const ChiaroFrame = require('./frame.js');

(async () => {
  const node = ChiaroFrame.renderFrame();
  console.log(`# ${ChiaroFrame.VERSION} — cross-runtime check`);
  console.log(`node   hash: ${node.hash}`);

  const browser = await chromium.launch({
    executablePath: '/home/eileen/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell',
    args: ['--no-sandbox', '--disable-gpu'],
    env: { ...process.env, LD_LIBRARY_PATH: '/home/eileen/libs/usr/lib/x86_64-linux-gnu' },
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto('file://' + path.resolve(__dirname, 'harness.html'));
    await page.waitForFunction('window.__FRAME_RESULT__ && window.__FRAME_RESULT__.hash');
    const br = await page.evaluate('window.__FRAME_RESULT__');

    // Independent read: what the DOM actually displays, not just the exposed var.
    const domText = await page.evaluate('document.getElementById("frame").textContent');
    const domHash = await page.evaluate('document.getElementById("hash").textContent');

    console.log(`browser hash: ${br.hash}`);
    const hashMatch = br.hash === node.hash;
    const textMatch = br.text === node.text;
    const domMatch = domText === node.text && domHash === node.hash;
    const clean = errors.length === 0;

    console.log(`hash  node === browser : ${hashMatch ? 'MATCH' : 'DIVERGE'}`);
    console.log(`text  node === browser : ${textMatch ? 'MATCH (' + node.text.length + ' bytes incl newlines)' : 'DIVERGE'}`);
    console.log(`DOM   display === node  : ${domMatch ? 'MATCH' : 'DIVERGE'}`);
    if (errors.length) console.log('page errors:', errors);

    if (hashMatch && textMatch && domMatch && clean) {
      console.log('\nVERDICT: byte-identical across runtimes — quilt contract holds here.');
      process.exit(0);
    } else {
      console.log('\nVERDICT: DIVERGENCE — contract broken, see above.');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('PW FAIL:', e); process.exit(1); });
