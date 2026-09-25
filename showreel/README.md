# Showreel 2026 — Jean Hauser

Showreel motion design de 20 s (1920×1080, 60 fps, motion blur, bande-son originale),
construit à partir des vrais projets GitHub : **Donatello**, **HAUUM**, **Chợ Vỉa Hè**,
**Café Bông**, **GIDEON**, **Plans & Ambiances** (outil-archi) et ce site.

Rendu final : [`out/showreel.mp4`](out/showreel.mp4)

## Découpage (120 BPM, 1 temps = 0,5 s)

| Temps | Section | Idée motion |
|---|---|---|
| 0 → 2 s | Boot | Grille suisse qui se trace, nom en *matrix-scramble* (clin d'œil au hero du site), caret bleu |
| 2 → 4 s | Manifeste | DESIGN / BUILD / SECURE / SHIP, un mot par temps, une technique par mot (graisse variable, block reveal, glitch RGB, zoom dans le point) |
| 4 → 8 s | Donatello | Code Solidity tapé, scan, finding E1 reentrancy, correctif (lignes permutées) → carte PASS, odomètre 277, 24 écosystèmes qui explosent puis se réorganisent en bar chart |
| 8 → 10 s | HAUUM | Carrousel 3D des 5 directions design, fond qui change de couleur à chaque direction, recul sur la rangée |
| 10 → 12 s | Chợ Vỉa Hè | Page kraft qui se tourne, illustrations d'Oriane en ressorts, scooter qui traverse, clic sur « Réserver une table » |
| 12 → 13,5 s | Café Bông | Arche + vidéo du phin, Fraunces, goutte de café qui éclabousse la transition |
| 13,5 → 15,5 s | GIDEON + Plans & Ambiances | Graphe d'agents avec impulsions, puis plan 2D qui se dessine et bascule en isométrique |
| 15,5 → 17,5 s | Selected work | Mur isométrique de toutes les pages, marquees, hyper-cut en double-croches |
| 17,5 → 18 s | Respiration | Flash, silence, caret seul |
| 18 → 20 s | Outro | Nom, soulignement, liens |

## Re-générer

```bash
pip install numpy scipy imageio-ffmpeg     # ffmpeg embarqué si absent du PATH
npm i -g playwright                        # ou playwright installé localement
python3 audio.py                           # → out/soundtrack.wav
node render.mjs                            # → out/showreel.mp4 (≈20 min, 10 sous-images/frame)
node render.mjs --mb 1 --fps 30            # brouillon rapide
node render.mjs --stills 4.6,9.2,18.6      # images fixes → out/stills/
```

Aperçu live : servir ce dossier (`npx serve showreel`) et ouvrir `index.html`
(espace = pause, ←/→ = image par image). Lancer `audio.py` d'abord pour avoir le son.

## Comment c'est fait

- `reel.js` : chaque propriété visuelle est une **fonction pure du temps** `t` —
  `window.renderFrame(t)` peut rendre n'importe quelle image isolément. Courbes de Bézier
  maison (ease-out expo, in-out « snappy »), ressorts amortis analytiques, aucun `setTimeout`.
- `render.mjs` : Chromium headless via Playwright, 4 workers en parallèle, capture CDP,
  **motion blur** par moyenne de sous-images (obturateur 180°) dans ffmpeg (`tmix`), puis H.264.
- `audio.py` : bande-son synthétisée de zéro (numpy/scipy) — kick, clap, basse sidechainée,
  pads, arpèges pentatoniques pour Chợ Vỉa Hè, et le sound design calé sur chaque événement.
- `assets/` : captures des sites réels, illustrations d'Oriane (Chợ Vỉa Hè), visuel GIDEON,
  images de la vidéo du phin (Café Bông), polices du site (Space Grotesk, Inter, JetBrains Mono)
  et des projets (Fraunces, Lora, Dancing Script).
