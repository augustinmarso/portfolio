# Portfolio — Augustin Marsollier

Site en ligne : https://augustinmarso.github.io/portfolio/

Accueil en canvas infini (glisser pour explorer), une page par projet. Next.js + shadcn/ui + GSAP, export statique déployé sur GitHub Pages à chaque push sur `main`.

## Développer

```bash
pnpm install
pnpm dev
```

## Ajouter ou mettre à jour des projets

Les images viennent des exports Behance (un dossier par projet, images numérotées). Le script les convertit en WebP et régénère `src/data/projects.json` :

```bash
node scripts/optimize-images.mjs "C:\claude\behance"
```
