# Showreel 2026 — Jean Hauser

Showreel motion design de 49 s (1920×1080, 60 fps, motion blur, bande-son originale),
construit à partir des vrais projets GitHub : **Donatello**, **HAUUM**, **Chợ Vỉa Hè**,
**Café Bông**, **GIDEON** (étude de cas), **Plans & Ambiances** (outil-archi) et ce site.

Rendu final : [`out/showreel.mp4`](out/showreel.mp4)

**v2** : rythme ×0,6 (la v1 regardée à 0,6× tombait juste, soit 72 BPM au lieu de 120),
palette GIDEON (`Core/Layout.lua` : NIGHT, PANEL, ROYAL, CYAN, GOLD) sur les scènes sombres
et palette du site (paper, ink, bleu `#1D4ED8`) sur les claires, et une étude de cas GIDEON
racontée façon forward-deployed engineer.

## Découpage (72 BPM, 1 temps = 0,83 s)

| Temps | Section | Idée motion |
|---|---|---|
| 0 → 3,3 s | Boot | Grille suisse qui se trace, nom en *matrix-scramble* (clin d'œil au hero du site), caret or |
| 3,3 → 6,7 s | Manifeste | DESIGN / BUILD / SECURE / SHIP, un mot par temps, une technique par mot (graisse variable, block reveal, glitch RGB, zoom dans le point) |
| 6,7 → 13,3 s | Donatello | Code Solidity tapé, scan, finding E1 reentrancy, correctif (lignes permutées) → carte PASS, odomètre 277, 24 écosystèmes qui explosent puis se réorganisent en bar chart |
| 13,3 → 16,7 s | HAUUM | Carrousel 3D des 5 directions design, fond qui change de couleur à chaque direction, recul sur la rangée |
| 16,7 → 20 s | Chợ Vỉa Hè | Page kraft qui se tourne, illustrations d'Oriane en ressorts, scooter qui traverse, clic sur « Réserver une table » |
| 20 → 22,5 s | Café Bông | Arche + vidéo du phin, Fraunces, goutte de café qui éclabousse la transition |
| 22,5 → 39,2 s | **GIDEON — étude de cas** | 01 Discover (le puzzle 4 vertes + 4 rouges, avec les textures de l'addon) · 02 Constraint (patch 12.0 « Secret Values ») · 03 Architect (Discord → VPS Lua 5.1 → SavedVariables → addon) · 04 Build (sortie réelle de `pairing_cli.lua`, `make check`, 398 tests) · 05 Ship (post Discord, panneau en jeu → « Ping ») · 06 Repeat (career-ops, trading, agentic workflows) |
| 39,2 → 41,7 s | Plans & Ambiances | Plan 2D qui se dessine puis bascule en isométrique |
| 41,7 → 45 s | Selected work | Mur isométrique de toutes les pages, marquees, hyper-cut en double-croches |
| 45 → 45,8 s | Respiration | Flash, silence, caret seul |
| 45,8 → 49,2 s | Outro | Nom, soulignement, liens |

Les textes de l'étude de cas viennent du README de GideonRaid (architecture, contraintes
12.0, résultat de référence de `make check`, distribution) et de hauserjean.fr (autres bots).

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
  tournent en « temps reel » (temps maître × 0,6), l'étude de cas GIDEON directement en temps
  maître. Courbes de Bézier maison (ease-out expo, in-out « snappy »), ressorts amortis
  analytiques, aucun `setTimeout`.
- `render.mjs` : Chromium headless via Playwright, 4 workers en parallèle, capture CDP,
  **motion blur** par moyenne de sous-images (obturateur 180°) dans ffmpeg (`tmix`), puis H.264,
  avec contrôle du nombre d'images en sortie.
- `audio.py` : bande-son synthétisée de zéro (numpy/scipy) — kick, clap, basse sidechainée,
  pads, arpèges pentatoniques pour Chợ Vỉa Hè, et le sound design calé sur chaque événement.
- `assets/` : captures des sites réels, illustrations d'Oriane (Chợ Vỉa Hè), visuel GIDEON et
  textures de l'addon (`assets/gideon/`), images de la vidéo du phin (Café Bông), polices du site
  (Space Grotesk, Inter, JetBrains Mono) et des projets (Fraunces, Lora, Dancing Script).
