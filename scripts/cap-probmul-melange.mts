/** Captures 390 px de probmul CE1 mélangé : une addition, une multiplication, un message ciblé. Usage : tsx scripts/cap-probmul-melange.mts */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { probmul } from '../src/exos/probmul';
const BASE = 'http://localhost:4174/compendium-primaire/';
const OUT = 'captures/probmul-melange'; fs.mkdirSync(OUT, { recursive: true });
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const open = async (h: string) => { await p.goto('about:blank'); await p.goto(BASE + h, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove())); await W(300); };
const tok = (l: string) => p.evaluate((l) => [...document.querySelectorAll<HTMLElement>('.ex-pool .tok')].findIndex((x) => x.textContent === l && !x.hidden), l);
const fill = async (vals: string[]) => { for (let i = 0; i < vals.length; i++) { await p.click(`.ex-pool .tok:nth-child(${(await tok(vals[i])) + 1})`); await p.click(`.ex-slot[data-s="${i}"]`); await W(60); } };
const find = (tpl: string) => { let s = 1; while (probmul.generate('CE1', 1, s).tpl !== tpl) s++; return s; };
const shot = async (name: string, solve: boolean, wrong?: string) => {
  const s = find(name.split('-')[0]); const d = probmul.generate('CE1', 1, s); const sol = probmul.solution(d);
  await open(`#/exo/probmul/CE1/1/${s}`);
  if (solve || wrong) {
    await fill([String(sol.nums[0]), wrong ?? sol.ops[0], String(sol.nums[1])]);
    for (const ch of String(wrong ? sol.nums[0] * sol.nums[1] : d.inst.answer)) await p.click(`.kp-k[data-k="${ch}"]`);
    await p.click('#check'); await W(400);
    await p.evaluate(() => document.querySelector('.fb')?.scrollIntoView({ block: 'end' })); await W(300);
  }
  await p.screenshot({ path: `${OUT}/${name}-ce1-390x844.png` });
  console.log(name, s, d.inst.model);
};
await shot('chaises-addition', true);
await shot('paquets-multiplication', true);
await shot('inegaux-message-cible', false, '×');
await b.close();
