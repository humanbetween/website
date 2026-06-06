# Compression média côté navigateur avant upload

**Date:** 2026-06-06
**App:** `apps/website` (humanprompts.ai)
**Branche:** `worktree-media-compression`

## Problème

La home charge des médias bruts énormes — une vidéo hero de **54 MB** servie en
autoplay (mesuré le 2026-06-06). C'est le goulot de réactivité. Les uploads sont
admin-only (`/api/admin/upload-url` vérifie `isAdmin`), donc faible volume.

Aujourd'hui le back-end ne voit jamais les octets : chaque formulaire admin
demande une URL présignée puis **le navigateur PUT le fichier directement sur
R2**. Le serveur Vercel n'a pas le fichier en main (et n'a ni ffmpeg ni la marge
de payload pour le traiter).

## Décision

Compresser **dans le navigateur de l'admin, avant le PUT présigné**. Zéro infra
nouvelle, on garde le flux direct-to-R2, le fichier lourd n'atteint jamais R2.

- **Images** → WebP (canvas), max 1600px sur le grand côté, qualité 0.82.
- **Vidéos** → H.264 720p (max 1280px de large), **sans audio**, `+faststart`,
  via `@ffmpeg/ffmpeg` (ffmpeg.wasm) en core single-thread.
- **Échec compression vidéo** (4K trop lourde, codec exotique, OOM) → **on
  bloque** avec un message clair. Aucun original lourd n'est uploadé.

## Architecture

Nouveau module client `src/lib/upload/` — **source unique de vérité** de l'upload.

| Fichier | Rôle | Testable |
|---|---|---|
| `strategy.ts` | Logique pure : routage par MIME, dimensions redimensionnées (no-upscale, dims paires), args ffmpeg, nom de sortie, format octets | ✅ pur |
| `compressImage.ts` | canvas → WebP (API navigateur) | navigateur |
| `compressVideo.ts` | ffmpeg.wasm → mp4 720p sans audio (API navigateur) | navigateur |
| `uploadToR2.ts` | Orchestrateur : compresse → presign → PUT → renvoie `{ url, originalSize, finalSize }` | navigateur |

Les **3 formulaires** admin qui font réellement un upload R2 (PromptForm,
HomeCtaBannerForm, PromoSettingsForm — les seuls qui appellent
`/api/admin/upload-url`) remplacent leur bloc inline `presign → PUT` par un
appel à `uploadToR2()`. La duplication disparaît. (Les autres forms de
`settings/` ne PUT que vers `/api/admin/site-settings`, pas R2.)

**Aucun changement back-end** : `makePresignedUpload` est déjà agnostique au
content-type. On lui passe les `{type, size, filename}` du fichier *compressé*.

## Routage par type (dans `strategy.ts` / `uploadToR2`)

- `video/*` → compressVideo → mp4 → présigné en `kind: "video"`.
- `image/svg+xml` → passthrough (vectoriel).
- `image/gif` → passthrough (préserve l'animation ; canvas perdrait les frames).
- `image/*` (png/jpg/webp…) → compressImage → webp → `kind: "asset"`.
- On garde le plus petit des deux (compressé vs original) pour les images déjà
  optimisées.

## Vidéo — détails ffmpeg.wasm

- Packages : `@ffmpeg/ffmpeg@0.12.15`, `@ffmpeg/util@0.12.2`,
  `@ffmpeg/core@0.12.10`.
- Core **single-thread** → pas de SharedArrayBuffer, donc **pas de headers
  COOP/COEP** (qui casseraient Stripe/embeds).
- `coreURL` + `wasmURL` chargés depuis le CDN unpkg (épinglé 0.12.10) via
  `toBlobURL`. Le **worker** est bundlé par Turbopack via le pattern interne
  `new URL("./worker.js", import.meta.url)` — on ne passe **pas** de
  `classWorkerURL` (les builds esm/umd du worker ne sont pas chargeables en blob
  URL : imports relatifs / importScripts).
  - *Déviation au design initial* : on avait dit « self-host le core ». Comme il
    n'y a **aucune CSP** sur le site (next.config minimal, pas de middleware), le
    CDN via `toBlobURL` est sûr et évite de committer ~32 MB de wasm + toute
    manip de build script. À revisiter si une CSP est ajoutée.
- Instance ffmpeg en **singleton** (load une fois, le core de ~32 MB n'est
  téléchargé qu'au premier transcodage, puis réutilisé).
- Args : `-i in -vf scale='min(1280,iw)':-2 -c:v libx264 -preset veryfast
  -crf 26 -an -movflags +faststart -pix_fmt yuv420p out.mp4`.
- Progress via `ffmpeg.on("progress")` → callback 0..1.

## UX

- Barre de progression + « Transcodage… ne ferme pas l'onglet » pendant la vidéo.
- Submit désactivé pendant la compression.
- Confirmation avant→après (« 54 MB → 1.8 MB »).
- Sur échec : message « Compression impossible, réduis la vidéo avant upload ».

## Hors scope (à traiter après)

1. Re-uploader la vidéo 54 MB déjà sur R2 via le nouveau flux.
2. Sortir du domaine `r2.dev` vers le domaine Cloudflare caché.
3. Quick wins de lecture : poster, `preload="metadata"`, lazy-load.

## Vérification

- `tsc --noEmit` + `eslint` + `next build` (Turbopack) — garde-fous statiques.
- **Pas de suite de tests configurée** dans le repo (seulement `lint` +
  `typecheck`). Pas de runner ajouté (hors scope). La logique de `strategy.ts`
  est pure et trivialement vérifiable par lecture.
- Vérif runtime = **test navigateur** sur déploiement preview Vercel : uploader
  une vraie vidéo lourde via le form admin, confirmer la sortie ~1-2 MB qui se
  lit, et le worker ffmpeg qui charge.
