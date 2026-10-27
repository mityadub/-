const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2], times = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html'));
  await p.waitForFunction(() => typeof window.setT === 'function');
  const list = times || Array.from({ length: 240 }, (_, i) => i / 24);
  for (let i = 0; i < list.length; i++) {
    await p.evaluate(t => window.setT(t), list[i]);
    const name = times ? `t${list[i].toFixed(2)}.png` : `f${String(i).padStart(4, '0')}.png`;
    await p.screenshot({ path: path.join(out, name) });
  }
  await b.close();
})();
