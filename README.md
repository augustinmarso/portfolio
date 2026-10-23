# Portfolio — Augustin Marsollier

Site en ligne : https://augustinmarso.github.io/portfolio/

Accueil en canvas infini (glisser pour explorer), une page par projet. Next.js + shadcn/ui + GSAP, export statique déployé sur GitHub Pages à chaque push sur `main`.

## Développer

```bash
pnpm install
pnpm dev
```

## Modifier le contenu : éditeur en ligne

Le contenu se modifie depuis l'éditeur en ligne, dépôt séparé : https://github.com/augustinmarso/portfolio-editeur
(page : https://augustinmarso.github.io/portfolio-editeur/). Il écrit directement dans ce dépôt par l'API GitHub ;
chaque publication est un commit sur `main`, donc le site se redéploie tout seul.

Ce que l'éditeur lit et écrit :

- `src/data/projects.json` : projets, ordre, planches (`public/projects/<slug>/`), couverture, image de survol ;
- `src/data/texts/<slug>.json` : textes, légendes, classement produit / processus (`processus` = indices des planches) ;
- `src/data/site.json` : titres, couvertures, projets à vidéo (`public/videos/<slug>.mp4` + `.jpg`) ;
- `src/data/embeds.json` : vidéos YouTube des projets ;
- `src/data/pages/*.json` : pages processus, cv, contact (et réseaux), pourquoi (manifeste) ;
- `src/data/corbeille.json` : projets retirés, restaurables depuis l'éditeur.

Le dépôt est la source de vérité. `scripts/optimize-images.mjs` régénère tout depuis les exports Behance
(`C:\claude\behance`) et effacerait les changements faits en ligne : il ne sert plus qu'à repartir de zéro
(`node scripts/optimize-images.mjs --force "C:\claude\behance"`).
