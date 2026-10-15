/** Service worker : hors ligne et mises à jour (bandeau « Mettre à jour »). Ne touche qu'aux caches « compendium-primaire ». */
import { toast } from './util';

let reg: ServiceWorkerRegistration | null = null;
export async function hardReset() {
  try {
    const mine = new URL('./', location.href).href;
    for (const r of (await navigator.serviceWorker?.getRegistrations?.()) ?? []) if (r.scope === mine) await r.unregister();
    for (const k of await caches.keys()) if (k.startsWith('compendium-primaire')) await caches.delete(k);
  } catch { /* ignore */ }
  location.reload();
}
function onWaiting() {
  if (!navigator.serviceWorker.controller) return;
  toast('Une nouvelle version est prête.', { label: 'Mettre à jour', run: () => reg?.waiting?.postMessage({ type: 'SKIP_WAITING' }) });
}
export function setupPWA() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => had && location.reload());
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then((r) => {
    reg = r;
    if (r.waiting) onWaiting();
    r.addEventListener('updatefound', () => {
      const w = r.installing;
      w?.addEventListener('statechange', () => {
        if (w.state !== 'installed') return;
        if (navigator.serviceWorker.controller) onWaiting();
        else toast('Prêt : l’appli marche maintenant sans internet.');
      });
    });
  }).catch(() => {});
}
