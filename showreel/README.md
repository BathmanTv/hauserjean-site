# Showreel 2026 — Jean Hauser

Showreel motion design de 57,5 s (1920×1080, 60 fps, motion blur, bande-son originale),
construit à partir des vrais projets GitHub : **Donatello**, **HAUUM**, **Chợ Vỉa Hè**,
**Café Bông**, **Plans & Ambiances** (outil-archi), **GIDEON** et ce site.

Rendu final : [`out/showreel.mp4`](out/showreel.mp4)

**v2** : rythme ×0,6 (la v1 regardée à 0,6× tombait juste, soit 72 BPM au lieu de 120),
palette GIDEON (`Core/Layout.lua` : NIGHT, PANEL, ROYAL, CYAN, GOLD) sur les scènes sombres
et palette du site (paper, ink, bleu `#1D4ED8`) sur les claires.

**v3** : la section GIDEON suit le brief de production `SHOWREEL_GIDEON_VIDEO.md`, dans sa
version courte de 30 s (§6.7 : scènes 1, 4 et 6), voix off en sous-titres FR cyan, titres en
Barlow Condensed, corps en Fira Sans.

**v4** : le plan fini de Plans & Ambiances reste 5 s de plus à l'écran ; GIDEON passe en fin
de parcours, juste avant le mur de projets, et se simplifie en deux idées : le fonctionnement
du bot Discord (d'après `FONCTIONNEMENT_BOT.md`) et l'addon de boss.

## Découpage (72 BPM, 1 temps = 0,83 s)

| Temps | Section | Idée motion |
|---|---|---|
| 0 → 3,3 s | Boot | Grille suisse qui se trace, nom en *matrix-scramble* (clin d'œil au hero du site), caret or |
| 3,3 → 6,7 s | Manifeste | DESIGN / BUILD / SECURE / SHIP, un mot par temps, une technique par mot (graisse variable, block reveal, glitch RGB, zoom dans le point) |
| 6,7 → 13,3 s | Donatello | Code Solidity tapé, scan, finding E1 reentrancy, correctif (lignes permutées) → carte PASS, odomètre 277, 24 écosystèmes qui explosent puis se réorganisent en bar chart |
| 13,3 → 16,7 s | HAUUM | Carrousel 3D des 5 directions design, fond qui change de couleur à chaque direction, recul sur la rangée |
| 16,7 → 20 s | Chợ Vỉa Hè | Page kraft qui se tourne, illustrations d'Oriane en ressorts, scooter qui traverse, clic sur « Réserver une table » |
| 20 → 22,5 s | Café Bông | Arche + vidéo du phin, Fraunces, goutte de café qui éclabousse la transition |
| 22,5 → 30 s | Plans & Ambiances | Plan 2D qui se dessine (murs, portes, cotes, pièces, ambiance) ; le plan fini **reste 5 s** en lent travelling avant, puis bascule en isométrique et s'éteint vers la nuit |
| 30 → 39,2 s | **GIDEON · le bot Discord** | Le parcours d'une commande en 5 étapes sur une timeline : `!greport <code>` qui se tape → accusé de réception (sablier) → API Warcraft Logs → un fil s'ouvre, le salon reste propre → résumé + rapport HTML ; puis « Il lit les logs officiels du jeu et rend un verdict chiffré. » / « Chaque chiffre est traçable jusqu'à sa source. » |
| 39,2 → 46,7 s | **GIDEON · l'addon de boss** | « Un clic, un rôle, et le groupe passe. » Le panneau s'ouvre seul, le curseur clique ses orbes → `ANCHOR — reste sur place, ping toi-même` ; légende des rôles, paires 4 verts + 4 rouges, liens CurseForge / GitHub |
| 46,7 → 49,8 s | **GIDEON · le nom** | GIDEON en or, la palette pulse, « Un bot, un addon, une guilde. », fondu vers la nuit |
| 49,8 → 53,3 s | Selected work | Mur isométrique de toutes les pages, marquees, hyper-cut en double-croches |
| 53,3 → 54,2 s | Respiration | Flash, silence, caret seul |
| 54,2 → 57,5 s | Outro | Nom, soulignement, liens |

Les textes GIDEON viennent de `FONCTIONNEMENT_BOT.md` (parcours d'une commande, « verdict
chiffré », « traçable jusqu'à sa source ») et du brief de l'addon (légende des rôles). Le bot
est montré en **schéma animé**, pas en fausse capture : les captures Discord réelles sont des
preuves à filmer, pas à générer. Aucun pseudo, identifiant de serveur ou message privé à l'écran.

## Re-générer

```bash
pip install numpy scipy imageio-ffmpeg     # ffmpeg embarqué si absent du PATH
npm i -g playwright                        # ou playwright installé localement
python3 audio.py                           # → out/soundtrack.wav
node render.mjs --mb 8                     # → out/showreel.mp4 (≈30 min, 8 sous-images/frame)
node render.mjs --mb 1 --fps 30            # brouillon rapide
node render.mjs --stills 9.2,24.8,35.2     # images fixes → out/stills/
```

Aperçu live : servir ce dossier (`npx serve showreel`) et ouvrir `index.html`
(espace = pause, ←/→ = image par image). Lancer `audio.py` d'abord pour avoir le son.

## Comment c'est fait

- `reel.js` : chaque propriété visuelle est une **fonction pure du temps** —
  `window.renderFrame(t)` peut rendre n'importe quelle image isolément. Les scènes de la v1
  tournent en « temps reel » (temps maître × 0,6), Plans & Ambiances a sa propre horloge (qui
  fige le plan fini 5 s), GIDEON tourne directement en temps maître.
  Courbes de Bézier maison (ease-out expo, in-out « snappy »), ressorts amortis
  analytiques, aucun `setTimeout`.
- `render.mjs` : Chromium headless via Playwright, 4 workers en parallèle, capture CDP,
  **motion blur** par moyenne de sous-images (obturateur 180°) dans ffmpeg (`tmix`), puis H.264,
  avec contrôle du nombre d'images en sortie.
- `audio.py` : bande-son synthétisée de zéro (numpy/scipy) — kick, clap, basse sidechainée,
  pads, arpèges pentatoniques pour Chợ Vỉa Hè, et le sound design calé sur chaque événement.
- `assets/` : captures des sites réels, illustrations d'Oriane (Chợ Vỉa Hè), visuel GIDEON et
  textures de l'addon (`assets/gideon/`), images de la vidéo du phin (Café Bông), polices du site
  (Space Grotesk, Inter, JetBrains Mono) et des projets (Fraunces, Lora, Dancing Script).
