// Convertit les exports Behance (C:\claude\behance) en WebP légers pour le site.
// Usage : node scripts/optimize-images.mjs --force [dossierSource]
// ⚠ Le site se modifie désormais depuis l'éditeur en ligne (dépôt portfolio-editeur) : le dépôt est la
// source de vérité. Ce script régénère TOUTES les images et projects.json depuis le dossier source et
// effacerait les changements faits en ligne ; il ne sert plus qu'à repartir de zéro, d'où --force.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

if (!process.argv.includes("--force")) {
  console.error("Ce script écrase les modifications faites dans l'éditeur en ligne. Relancer avec --force pour confirmer.");
  process.exit(1);
}
const SRC = path.resolve(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "../behance");
const OUT = path.resolve("public/projects");
const DATA = path.resolve("src/data/projects.json");
const FULL = 2000;
const SMALL = 1000; // variante légère des planches (téléphones, petits écrans)
const THUMB = 560; // vignettes de l'index (cartes d'environ 240 px, nettes en Retina)
const EXT = /\.(jpe?g|png|gif|webp)$/i;

// Réglages modifiables depuis l'éditeur local (scripts/editeur) : ordre, titres, couvertures.
// Vignette de l'index : numéro d'image du projet, ou "_covers" pour <source>/_covers/<slug>.*
const SITE_FILE = path.resolve("src/data/site.json");
const SITE = JSON.parse(await fs.readFile(SITE_FILE, "utf8"));
const COVERS = SITE.covers ?? {};

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const projects = [];
const coverFiles = await fs.readdir(path.join(SRC, "_covers")).catch(() => []);
// Image révélée au survol dans l'index (l'objet en usage) : <source>/_hover/<slug>.*
const hoverFiles = await fs.readdir(path.join(SRC, "_hover")).catch(() => []);
for (const dir of (await fs.readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory() && !d.name.startsWith("_"))) {
  const title = dir.name;
  const slug = slugify(title);
  const outDir = path.join(OUT, slug);
  await fs.mkdir(outDir, { recursive: true });

  const files = (await fs.readdir(path.join(SRC, title))).filter((f) => EXT.test(f)).sort();
  const images = [];
  for (const [i, file] of files.entries()) {
    const input = path.join(SRC, title, file);
    const animated = /\.(gif|webp)$/i.test(file); // GIF ou WebP animés
    const name = String(i + 1).padStart(2, "0");
    // les animations pèsent une image par vue : plus petites et plus compressées (1000 px, qualité 62)
    const max = animated ? 1000 : FULL;
    const full = await sharp(input, { animated, limitInputPixels: false })
      .rotate() // applique l'orientation EXIF des photos d'appareil
      .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
      .webp(animated ? { quality: 62, effort: 6 } : { quality: 80 })
      .toFile(path.join(outDir, `${name}.webp`));
    let sm;
    if (!animated && full.width > SMALL * 1.2) {
      await sharp(input, { limitInputPixels: false })
        .rotate()
        .resize({ width: SMALL, height: SMALL * 2, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path.join(outDir, `${name}-sm.webp`));
      sm = `/projects/${slug}/${name}-sm.webp`;
    }
    images.push({ src: `/projects/${slug}/${name}.webp`, ...(sm && { sm }), width: full.width, height: animated ? full.pageHeight ?? full.height : full.height });
    const pick = COVERS[slug];
    const isCover = pick === "_covers" ? i === 0 : pick ? name === pick : i === 0;
    if (isCover) {
      const own = pick === "_covers" && coverFiles.find((f) => f.startsWith(`${slug}.`));
      const t = await sharp(own ? path.join(SRC, "_covers", own) : input, { limitInputPixels: false })
        .rotate()
        .resize({ width: THUMB, height: THUMB, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path.join(outDir, "thumb.webp"));
      images.thumb = { src: `/projects/${slug}/thumb.webp`, width: t.width, height: t.height };
    }
    process.stdout.write(".");
  }
  const hoverFile = hoverFiles.find((f) => f.startsWith(`${slug}.`));
  let hover;
  if (hoverFile) {
    const h = await sharp(path.join(SRC, "_hover", hoverFile), { limitInputPixels: false })
      .rotate()
      .resize({ width: THUMB, height: THUMB, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(outDir, "hover.webp"));
    hover = { src: `/projects/${slug}/hover.webp`, width: h.width, height: h.height };
  }
  projects.push({ slug, title, cover: images.thumb, ...(hover && { hover }), images: [...images] });
  console.log(` ${title} (${images.length})`);
}

// Ordre choisi dans l'éditeur ; les nouveaux projets arrivent à la fin.
const rank = (slug) => {
  const i = (SITE.order ?? []).indexOf(slug);
  return i === -1 ? 1e6 : i;
};
projects.sort((x, y) => rank(x.slug) - rank(y.slug));
SITE.order = projects.map((p) => p.slug);
await fs.writeFile(SITE_FILE, JSON.stringify(SITE, null, 2) + "\n");

// Index des textes (un JSON par projet) : régénéré pour suivre les ajouts et suppressions.
const TEXTS = path.resolve("src/data/texts");
const ident = (s) => s.replace(/[^a-zA-Z0-9]/g, "_");
const textSlugs = (await fs.readdir(TEXTS)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
await fs.writeFile(
  path.join(TEXTS, "index.ts"),
  [
    "// Généré par scripts/optimize-images.mjs : un fichier JSON par projet, même slug que les images.",
    'import type { ProjectText } from "@/lib/projects";',
    ...textSlugs.map((s) => `import ${ident(s)} from "./${s}.json";`),
    "",
    "export const texts: Record<string, ProjectText> = {",
    ...textSlugs.map((s) => `  "${s}": ${ident(s)},`),
    "};",
    "",
  ].join("\n")
);

await fs.mkdir(path.dirname(DATA), { recursive: true });
await fs.writeFile(DATA, JSON.stringify(projects, null, 2));
console.log(`→ ${projects.length} projets écrits dans ${path.relative(process.cwd(), DATA)}`);
