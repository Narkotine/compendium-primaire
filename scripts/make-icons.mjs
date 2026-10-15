#!/usr/bin/env node
/** Icônes : une plaque, une barre, un cube (matériel de numération). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const motif = `<rect x="110" y="150" width="150" height="150" rx="10" fill="#fff"/><rect x="290" y="150" width="40" height="210" rx="8" fill="#ffd166"/><rect x="360" y="320" width="40" height="40" rx="8" fill="#fff"/>`;
const svg = (r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${r}" fill="#c43c50"/>${motif}</svg>`;
fs.writeFileSync(path.join(OUT, 'favicon.svg'), svg(116));
const png = (s, size, name) => sharp(Buffer.from(s)).resize(size, size).png().toFile(path.join(OUT, name));
await Promise.all([png(svg(116), 192, 'icon-192.png'), png(svg(116), 512, 'icon-512.png'), png(svg(0), 512, 'maskable-512.png'), png(svg(0), 180, 'apple-touch-icon.png')]);
console.log('icônes ok');
