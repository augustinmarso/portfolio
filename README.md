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

## Éditeur local (uniquement sur l'ordinateur d'Augustin)

Double-cliquer sur `Editeur.cmd` (ou `pnpm editeur`), puis ouvrir http://localhost:5310.

- Projets : glisser pour changer l'ordre, créer, retirer.
- Images : glisser pour réordonner, ajouter (déposer des fichiers), retirer, choisir la couverture de l'index.
- Textes : titre, année, contexte, thèmes, texte et légendes.
- « Publier en ligne » : régénère les images, vérifie le code, puis envoie sur GitHub (le site se met à jour en 1 à 2 minutes).

Rien n'est effacé : ce qui est retiré part dans `../behance/_corbeille/<date>/`. Le serveur n'écoute que `127.0.0.1` et refuse les requêtes venant d'autres sites.
Réglages partagés avec le site : `src/data/site.json` (ordre, titres, couvertures, vidéos).
