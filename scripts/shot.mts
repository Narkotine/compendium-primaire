#!/usr/bin/env -S npx tsx
/** Capture unique : tsx scripts/shot.mts <fichier.png> <largeur> <hauteur> <light|dark> <hash> [js à exécuter] */
import puppeteer from 'puppeteer-core';
const [out, w, h, theme, hash, js] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await (await b.createBrowserContext()).newPage();
await p.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument((t) => localStorage.setItem('compendium-primaire.settings', JSON.stringify({ theme: t })), theme);
await p.goto('http://localhost:4174/compendium-primaire/' + (hash || ''), { waitUntil: 'networkidle0' });
if (js) { await p.evaluate(js); await new Promise((r) => setTimeout(r, 300)); }
await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove()));
await p.screenshot({ path: out });
await b.close();
