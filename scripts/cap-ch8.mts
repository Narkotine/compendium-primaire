import puppeteer from 'puppeteer-core';
const BASE = 'http://localhost:4174/compendium-primaire/';
const OUT = 'captures/ch08/';
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
async function shot(name: string, hash: string) {
  const p = await (await b.createBrowserContext()).newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(BASE + hash, { waitUntil: 'networkidle0' });
  await W(200);
  await p.screenshot({ path: `${OUT}${name}.png` });
  console.log(name);
  await p.close();
}
await shot('01-cours-mesures', '#/cours/mesures');
await shot('02-horloge', '#/exo/horloge/CE1/1/3');
await shot('03-aire', '#/exo/aire/CM1/1/2');
await b.close();
