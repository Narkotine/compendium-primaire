#!/usr/bin/env bash
# Publie dist/ sur la branche gh-pages (GitHub Pages, https://narkotine.github.io/compendium-primaire/).
# Rebuild + tests, puis un commit NORMAL (jamais de force-push) ajouté à gh-pages.
# Usage : npm run publish:gh            (SKIP_TESTS=1 pour sauter les tests)
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=${REMOTE:-origin}
[ -z "$(git status --porcelain)" ] || { echo "Arbre de travail non propre : commite d'abord les sources." >&2; exit 1; }
npm run build
if [ -z "${SKIP_TESTS:-}" ]; then npm test; fi
[ -f dist/.nojekyll ] || { echo "dist/.nojekyll manquant" >&2; exit 1; }
[ -f dist/404.html ] || { echo "dist/404.html manquant" >&2; exit 1; }
VERSION=$(node -p "require('./package.json').version")
SRC=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git fetch "$REMOTE" gh-pages
git worktree add "$TMP" "$REMOTE/gh-pages" --detach
trap 'git worktree remove --force "$TMP"' EXIT
find "$TMP" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a dist/. "$TMP"/
git -C "$TMP" add -A
if git -C "$TMP" diff --cached --quiet; then echo "Rien de neuf à publier."; exit 0; fi
git -C "$TMP" commit -qm "Publication v$VERSION (sources $SRC)"
git -C "$TMP" push "$REMOTE" HEAD:gh-pages
echo "Publié v$VERSION : https://narkotine.github.io/compendium-primaire/ (build Pages en cours, ~1 min)"
