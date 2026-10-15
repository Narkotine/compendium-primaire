import puppeteer from 'puppeteer-core';
const BASE = 'http://localhost:4174/compendium-primaire/';
const OUT = 'captures/ch06/';
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
async function shot(name: string, hash: string, act?: (p: import('puppeteer-core').Page) => Promise<void>) {
  const p = await (await b.createBrowserContext()).newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(BASE + hash, { waitUntil: 'networkidle0' });
  if (act) await act(p);
  await W(200);
  await p.screenshot({ path: `${OUT}${name}.png` });
  console.log(name);
  await p.close();
}
await shot('01-cours-decimaux', '#/cours/decimaux', async (p) => { await p.evaluate(() => document.querySelectorAll('.prose h2')[1]?.scrollIntoView()); });
await shot('02-deccomp', '#/exo/deccomp/CM1/2/5');
await shot('03-dectableau', '#/exo/dectableau/CM1/1/3');
await shot('04-decpose', '#/exo/decpose/CM1/2/2');
await b.close();
