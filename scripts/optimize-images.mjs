// Convertit les exports Behance (C:\claude\behance) en WebP légers pour le site.
// Usage : node scripts/optimize-images.mjs [dossierSource]
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(process.argv[2] ?? "../behance");
const OUT = path.resolve("public/projects");
const DATA = path.resolve("src/data/projects.json");
const FULL = 2000;
const THUMB = 900;
const EXT = /\.(jpe?g|png|gif|webp)$/i;

// Vignette de l'index : une vraie image (photo, rendu), jamais une planche de présentation.
// Numéro d'image du projet, ou fichier dans <source>/_covers/<slug>.*
const COVERS = {
  kai: "05",
  "la-societe-de-jeux": "_covers",
  "recolteur-pomme-de-pin": "07",
  "le-jeu-de-la-grenouille": "_covers",
  ephemeride: "01",
  "cylinder-chair": "02",
  echappee: "_covers",
  "open-mind": "_covers",
  ratp: "_covers",
  "de-passager-a-equipier": "_covers",
  ludilove: "_covers",
  "cafetiere-au-beurre": "_covers",
};

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const projects = [];
const coverFiles = await fs.readdir(path.join(SRC, "_covers")).catch(() => []);
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
    const full = await sharp(input, { animated, limitInputPixels: false })
      .rotate() // applique l'orientation EXIF des photos d'appareil
      .resize({ width: FULL, height: FULL, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(outDir, `${name}.webp`));
    images.push({ src: `/projects/${slug}/${name}.webp`, width: full.width, height: animated ? full.pageHeight ?? full.height : full.height });
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
  projects.push({ slug, title, cover: images.thumb, images: [...images] });
  console.log(` ${title} (${images.length})`);
}

await fs.mkdir(path.dirname(DATA), { recursive: true });
await fs.writeFile(DATA, JSON.stringify(projects, null, 2));
console.log(`→ ${projects.length} projets écrits dans ${path.relative(process.cwd(), DATA)}`);
