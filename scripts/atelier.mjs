// Atelier portfolio sur Google Drive : un dossier par projet, rangé selon la méthode de la page Processus.
//
//   <atelier>/<projet>/produit/          planches du produit fini (6 au moins)
//   <atelier>/<projet>/1-s-etonner/ …    une planche par fichier, pour chaque étape de la méthode
//   <atelier>/<projet>/0-a-classer/      planches du processus pas encore rangées dans une étape
//
// Dans chaque dossier, l'ordre est celui des noms de fichiers ; le nom sert de légende
// (« 03 Croquis de recherche.jpg » → légende « Croquis de recherche »).
//
// Usage (depuis C:\claude\portfolio) :
//   node scripts/atelier.mjs tirer [projet…] [--ecraser]   dépôt → Drive (crée les dossiers d'un projet)
//   node scripts/atelier.mjs etat                          ce qui manque, + tableau-de-bord.html dans l'atelier
//   node scripts/atelier.mjs publier [projet…] [--sans-pousser] [--forcer]
//                                                          Drive → dépôt : images, légendes, étapes, puis commit et push
//
// Sécurité : à chaque tirage ou publication, <projet>/_atelier.json garde l'empreinte des planches du dépôt.
// Si le projet a changé dans l'éditeur en ligne depuis, la publication s'arrête (--forcer pour passer outre).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { existsSync } from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const ATELIER = process.env.ATELIER_PORTFOLIO ?? "G:\\Mon Drive\\Atelier portfolio";
const DATA = path.join(ROOT, "src/data/projects.json");
const TEXTS = path.join(ROOT, "src/data/texts");
const PUBLIC = path.join(ROOT, "public");
const METHODE_FILE = path.join(ROOT, "src/data/pages/processus.json");
const METHODE = JSON.parse(await fs.readFile(METHODE_FILE, "utf8"));
const FULL = 2000;
const SMALL = 1000;
const MIN_PRODUIT = 6;
const SITE_FILE = path.join(ROOT, "src/data/site.json");
const VIDEO = /\.(mp4|mov|webm|mkv)$/i;
const FFMPEG = [process.env.FFMPEG, "C:/claude/_tools/ffmpeg/ffmpeg-8.1.1-essentials_build/bin/ffmpeg.exe"].find((f) => f && existsSync(f)) ?? "ffmpeg";
const EXT = /\.(jpe?g|png|gif|webp|avif|tiff?)$/i;

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const STEP_DIRS = METHODE.etapes.map((e, i) => `${i + 1}-${slugify(e.titre)}`);
const PRODUIT = "produit";
const A_CLASSER = "0-a-classer";
const FOLDERS = [PRODUIT, ...STEP_DIRS, A_CLASSER];
// dossiers de travail (rendus 3D sources, références d'ambiance), jamais publiés
const WORK = ["_sources", "_references", "_impression"];
// série produit attendue : plans repérés par le nom des fichiers du dossier « produit »
const SERIE = [
  { nom: "mise en situation", motif: /situation/i, min: 1 },
  { nom: "éclaté", motif: /[ée]clat[ée]/i, min: 1 },
  { nom: "packaging", motif: /packaging|emballage/i, min: 1 },
  { nom: "couleur matière finition", motif: /couleur|mati[eè]re|finition|cmf/i, min: 3 },
  { nom: "photo sur fond", motif: /fond/i, min: 1 },
];

const args = process.argv.slice(2);
const cmd = args[0];
const flags = new Set(args.filter((a) => a.startsWith("--")));
const only = args.slice(1).filter((a) => !a.startsWith("--"));

const readJson = async (f, fallback) => JSON.parse(await fs.readFile(f, "utf8").catch(() => JSON.stringify(fallback)));
const writeJson = (f, v) => fs.writeFile(f, JSON.stringify(v, null, 2) + "\n");
const sha1 = async (f) => crypto.createHash("sha1").update(await fs.readFile(f)).digest("hex");
const exists = (f) => fs.access(f).then(() => true, () => false);
const pad = (n) => String(n).padStart(2, "0");
const base = (src) => src.split("/").pop();
const natural = (a, b) => a.localeCompare(b, "fr", { numeric: true });
// nom de fichier → légende : numéro d'ordre en tête et extension retirés
// (« (retouché) », ajouté par scripts/rendu.mjs, n'apparaît jamais sur le site)
const captionOf = (file) => file.replace(EXT, "").replace(/\s*\(retouch[ée]\)\s*$/i, "").replace(/^\d+[\s._-]*/, "").trim();
// légende → partie lisible du nom de fichier (Windows refuse \ / : * ? " < > |)
const safe = (caption) => (caption ?? "").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
const fileName = (n, caption) => `${pad(n)}${safe(caption) ? " " + safe(caption) : ""}.webp`;

// notes.md : quelques phrases par étape, affichées sous chaque intertitre de l'onglet processus.
// Titres « ## 1. s'étonner », « ## 2. chercher »… ; commentaires <!-- --> ignorés ; ligne vide = paragraphe.
const NOTES = "notes.md";
const modeleNotes = (title, notes = {}) =>
  `# Notes de ${title}\n\n<!-- Sous chaque étape : 2 ou 3 phrases, ce que tu as fait et la décision prise au jalon.\n` +
  `     Étape laissée vide : rien n'est affiché. Une ligne vide sépare deux paragraphes. -->\n\n` +
  METHODE.etapes.map((e, i) => `## ${i + 1}. ${e.titre}\n\n${(notes[i + 1] ?? []).map((x) => x + "\n\n").join("")}`).join("");
function lireNotes(txt) {
  const out = {};
  let cur = 0;
  for (const line of txt.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
    const h = line.match(/^#{1,6}\s*(\d+)\b/);
    if (h) cur = Number(h[1]);
    else if (/^#/.test(line)) cur = 0;
    else if (cur >= 1 && cur <= METHODE.etapes.length) out[cur] = (out[cur] ?? "") + line + "\n";
  }
  return Object.fromEntries(
    Object.entries(out)
      .map(([k, v]) => [k, v.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean)])
      .filter(([, v]) => v.length)
  );
}

const projects = await readJson(DATA, []);
const selected = only.length ? projects.filter((p) => only.includes(p.slug)) : projects;
if (only.length && selected.length !== only.length) {
  const known = new Set(projects.map((p) => p.slug));
  console.error(`Projet inconnu : ${only.filter((s) => !known.has(s)).join(", ")}`);
  process.exit(1);
}
const textOf = (slug) => readJson(path.join(TEXTS, `${slug}.json`), {});
const repoFile = (src) => path.join(PUBLIC, src);

// empreintes des planches actuellement dans le dépôt, dans l'ordre
const repoPrints = async (p) => Promise.all(p.images.map((im) => sha1(repoFile(im.src))));

async function tirer() {
  await fs.mkdir(ATELIER, { recursive: true });
  for (const p of selected) {
    const dir = path.join(ATELIER, p.slug);
    if ((await exists(dir)) && !flags.has("--ecraser")) {
      console.log(`· ${p.slug} : déjà dans l'atelier (--ecraser pour le recréer depuis le dépôt)`);
      continue;
    }
    await fs.rm(dir, { recursive: true, force: true });
    for (const f of [...FOLDERS, ...WORK]) await fs.mkdir(path.join(dir, f), { recursive: true });
    const t = await textOf(p.slug);
    const proc = new Set(t.processus ?? []);
    const count = Object.fromEntries(FOLDERS.map((f) => [f, 0]));
    const prints = await repoPrints(p);
    const files = {};
    const legendes = {}; // légende exacte, que le nom de fichier ne peut pas toujours porter
    for (const [n, im] of p.images.entries()) {
      const step = proc.has(n) ? t.etapes?.[base(im.src)] ?? 0 : -1;
      const folder = step === -1 ? PRODUIT : step ? STEP_DIRS[step - 1] : A_CLASSER;
      const name = fileName(++count[folder], t.captions?.[n]);
      await fs.copyFile(repoFile(im.src), path.join(dir, folder, name));
      files[prints[n]] = im.src;
      legendes[prints[n]] = t.captions?.[n] ?? "";
    }
    await writeJson(path.join(dir, "_atelier.json"), { depot: prints, fichiers: files, legendes });
    if (!(await exists(path.join(dir, NOTES)))) await fs.writeFile(path.join(dir, NOTES), modeleNotes(p.title, t.notesEtapes));
    console.log(`✓ ${p.slug} : ${p.images.length} planches tirées`);
  }
  await etat();
}

// Contenu d'un projet dans l'atelier : planches par dossier, dans l'ordre des noms.
async function lireAtelier(slug) {
  const dir = path.join(ATELIER, slug);
  if (!(await exists(dir))) return null;
  const out = {};
  for (const f of FOLDERS) {
    const names = (await fs.readdir(path.join(dir, f)).catch(() => [])).filter((n) => EXT.test(n)).sort(natural);
    out[f] = names.map((n) => path.join(dir, f, n));
  }
  return out;
}

async function etat() {
  const rows = [];
  for (const p of projects) {
    const a = await lireAtelier(p.slug);
    let counts;
    const prodNames = a ? a[PRODUIT].map((f) => path.basename(f)) : [];
    const plans = SERIE.filter((s) => prodNames.filter((n) => s.motif.test(n)).length < s.min).map((s) => s.nom);
    if (a) counts = Object.fromEntries(FOLDERS.map((f) => [f, a[f].length]));
    else {
      // pas encore dans l'atelier : compte d'après le dépôt
      const t = await textOf(p.slug);
      const proc = new Set(t.processus ?? []);
      counts = Object.fromEntries(FOLDERS.map((f) => [f, 0]));
      p.images.forEach((im, n) => {
        const step = proc.has(n) ? t.etapes?.[base(im.src)] ?? 0 : -1;
        counts[step === -1 ? PRODUIT : step ? STEP_DIRS[step - 1] : A_CLASSER]++;
      });
    }
    const manques = [
      counts[PRODUIT] < MIN_PRODUIT && `${MIN_PRODUIT - counts[PRODUIT]} planche(s) produit`,
      ...STEP_DIRS.filter((f) => !counts[f]).map((f) => `étape ${f}`),
      counts[A_CLASSER] && `${counts[A_CLASSER]} à classer`,
      ...(a ? plans.map((n) => `plan « ${n} »`) : []),
    ].filter(Boolean);
    // impressions 3D : G-code dans _impression/, date du plus récent
    const imprDir = path.join(ATELIER, p.slug, "_impression");
    const gcodes = (await fs.readdir(imprDir).catch(() => [])).filter((n) => n.endsWith(".gcode"));
    const dates = await Promise.all(gcodes.map((n) => fs.stat(path.join(imprDir, n)).then((st) => st.mtime)));
    const impressions = { n: gcodes.length, last: dates.length ? new Date(Math.max(...dates)) : null };
    const notes = Object.keys(lireNotes(await fs.readFile(path.join(ATELIER, p.slug, NOTES), "utf8").catch(() => ""))).length;
    if (a && notes < STEP_DIRS.length) manques.push(`textes ${notes}/${STEP_DIRS.length} étapes`);
    rows.push({ slug: p.slug, title: p.title, atelier: !!a, counts, manques, impressions });
  }

  const w = Math.max(...rows.map((r) => r.slug.length));
  console.log(`\n${"projet".padEnd(w)}  produit  ${STEP_DIRS.map((_, i) => `é${i + 1}`).join("  ")}  à classer`);
  for (const r of rows) {
    const c = r.counts;
    console.log(
      `${r.slug.padEnd(w)}  ${String(c[PRODUIT]).padStart(3)}${c[PRODUIT] >= MIN_PRODUIT ? " ✓" : " ✗"}    ` +
        STEP_DIRS.map((f) => String(c[f] || "·").padStart(2)).join("  ") +
        `  ${String(c[A_CLASSER] || "·").padStart(5)}${r.atelier ? "" : "   (pas encore dans l'atelier)"}`
    );
  }
  const complets = rows.filter((r) => !r.manques.length).length;
  console.log(`\n${complets}/${rows.length} projets complets (${MIN_PRODUIT} planches produit et au moins une planche par étape).`);

  if (await exists(ATELIER)) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
    const cell = (n, ok) => `<td class="${ok ? "ok" : "ko"}">${n || "·"}</td>`;
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Atelier portfolio</title>
<style>body{font:15px system-ui,sans-serif;margin:32px;color:#111}h1{font-size:32px;margin:0 0 4px}p{color:#666}
table{border-collapse:collapse;margin-top:24px}th,td{padding:6px 10px;border-bottom:1px solid #eee;text-align:center}
th:first-child,td:first-child,td:last-child{text-align:left}td.ok{color:#111}td.ko{color:#c33;font-weight:600}td.manque{color:#c33;font-size:13px}</style>
<h1>Atelier portfolio</h1><p>Mis à jour le ${new Date().toLocaleString("fr-FR")} · ${complets}/${rows.length} projets complets ·
objectif : ${MIN_PRODUIT} planches produit (${SERIE.map((s) => (s.min > 1 ? `${s.min} × ` : "") + s.nom).join(", ")}) et au moins une planche par étape.
Retouche IA (seulement retirer un objet d'une photo ou ajouter une personne sur un rendu 3D) : retoucher.cmd · publier : publier.cmd.</p>
<table><tr><th>projet</th><th>produit</th>${METHODE.etapes.map((e, i) => `<th>${i + 1}. ${esc(e.titre)}</th>`).join("")}<th>à classer</th><th>impressions</th><th>il manque</th></tr>
${rows
  .map(
    (r) =>
      `<tr><td>${esc(r.title)}${r.atelier ? "" : " <small>(pas dans l'atelier)</small>"}</td>${cell(r.counts[PRODUIT], r.counts[PRODUIT] >= MIN_PRODUIT)}${STEP_DIRS.map((f) => cell(r.counts[f], r.counts[f] > 0)).join("")}${cell(r.counts[A_CLASSER], !r.counts[A_CLASSER])}<td>${r.impressions.n ? `${r.impressions.n} <small>(${r.impressions.last.toLocaleDateString("fr-FR")})</small>` : "·"}</td><td class="manque">${esc(r.manques.join(", ") || "—")}</td></tr>`
  )
  .join("\n")}</table>`;
    await fs.writeFile(path.join(ATELIER, "tableau-de-bord.html"), html);
    console.log(`Tableau de bord : ${path.join(ATELIER, "tableau-de-bord.html")}`);
  }
}

async function encoder(input, outDir, name) {
  const animated = /\.(gif|webp)$/i.test(input) && ((await sharp(input).metadata()).pages ?? 1) > 1;
  const max = animated ? 1000 : FULL;
  const full = await sharp(input, { animated, limitInputPixels: false })
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .webp(animated ? { quality: 62, effort: 6 } : { quality: 80 })
    .toFile(path.join(outDir, `${name}.webp`));
  let sm = false;
  if (!animated && full.width > SMALL * 1.2) {
    await sharp(input, { limitInputPixels: false })
      .rotate()
      .resize({ width: SMALL, height: SMALL * 2, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(outDir, `${name}-sm.webp`));
    sm = true;
  }
  return { width: full.width, height: animated ? full.pageHeight ?? full.height : full.height, sm };
}

// La page Processus désigne ses planches par « projet numéro » : après renumérotation, on suit les planches
// gardées et on retire celles qui ont disparu.
function renumeroter(slug, remap) {
  const move = (line) => {
    const [s, n] = line.trim().split(/\s+/);
    if (s !== slug) return line;
    return remap.has(Number(n)) ? `${s} ${remap.get(Number(n))}` : null;
  };
  for (const e of METHODE.etapes) {
    if (e.exemples) e.exemples = e.exemples.map(move).filter(Boolean);
    if (e.image && !(e.image = move(e.image))) delete e.image;
  }
}

// Onglet produit : la série dans un ordre fixe (photo sur fond, mise en situation, éclaté, couleur matière
// finition, packaging), repérée par le nom des fichiers ; les autres planches suivent dans l'ordre des noms.
const ORDRE_SERIE = ["photo sur fond", "mise en situation", "éclaté", "couleur matière finition", "packaging"];
function ordreProduit(files) {
  const rang = (f) => {
    const i = ORDRE_SERIE.findIndex((nom) => SERIE.find((s) => s.nom === nom).motif.test(path.basename(f)));
    return i === -1 ? ORDRE_SERIE.length : i;
  };
  return files.map((f, i) => ({ f, i })).sort((x, y) => rang(x.f) - rang(y.f) || x.i - y.i).map((x) => x.f);
}

async function publier() {
  // le site se déploie depuis main : publier ailleurs (branche d'une PR…) n'enverrait rien en ligne
  const branche = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT }).toString().trim();
  if (branche !== "main" && !flags.has("--sans-pousser")) {
    console.error(`✗ Le dépôt est sur la branche « ${branche} », pas sur main : rien publié. Revenir sur main (git switch main) puis relancer.`);
    process.exit(1);
  }
  const done = [];
  const site = await readJson(SITE_FILE, {});
  const boucles = new Set(site.boucles ?? []);
  for (const p of selected) {
    const a = await lireAtelier(p.slug);
    if (!a) {
      if (only.length) console.log(`· ${p.slug} : pas dans l'atelier (lancer d'abord « tirer »)`);
      continue;
    }
    const dir = path.join(ATELIER, p.slug);
    const memo = await readJson(path.join(dir, "_atelier.json"), { depot: [], fichiers: {} });
    const now = await repoPrints(p);
    if (now.join() !== memo.depot.join() && !flags.has("--forcer")) {
      console.log(`✗ ${p.slug} : modifié en ligne depuis le dernier tirage. Retirer le projet (tirer ${p.slug} --ecraser) ou publier avec --forcer.`);
      continue;
    }
    const order = [
      ...ordreProduit(a[PRODUIT]).map((f) => ({ f, step: -1 })),
      ...STEP_DIRS.flatMap((d, i) => a[d].map((f) => ({ f, step: i + 1 }))),
      ...a[A_CLASSER].map((f) => ({ f, step: 0 })),
    ];
    if (!order.length) {
      console.log(`✗ ${p.slug} : aucune planche dans l'atelier, rien publié.`);
      continue;
    }
    if (a[PRODUIT].length < MIN_PRODUIT) console.log(`! ${p.slug} : ${a[PRODUIT].length} planche(s) produit sur ${MIN_PRODUIT} conseillées`);

    // nouvelles planches écrites à part, puis échangées avec les anciennes (vignette et survol gardés)
    const outDir = path.join(PUBLIC, "projects", p.slug);
    const tmp = `${outDir}.atelier`;
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });
    const images = [];
    const captions = [];
    const processus = [];
    const etapes = {};
    const fichiers = {};
    const legendes = {};
    let reused = 0;
    const remap = new Map(); // ancien numéro de planche → nouveau
    for (const [i, { f, step }] of order.entries()) {
      const name = pad(i + 1);
      const print = await sha1(f);
      const old = memo.fichiers[print];
      let dims;
      if (old && (await exists(repoFile(old)))) {
        // planche inchangée : on reprend les fichiers du dépôt sans recompresser
        const im = p.images.find((x) => x.src === old);
        await fs.copyFile(repoFile(old), path.join(tmp, `${name}.webp`));
        const oldSm = im?.sm && repoFile(im.sm);
        if (oldSm && (await exists(oldSm))) await fs.copyFile(oldSm, path.join(tmp, `${name}-sm.webp`));
        dims = { width: im?.width, height: im?.height, sm: !!(oldSm && (await exists(oldSm))) };
        if (!im) dims = await encoder(f, tmp, name);
        reused++;
        if (im) remap.set(p.images.indexOf(im), i);
      } else dims = await encoder(f, tmp, name);
      const src = `/projects/${p.slug}/${name}.webp`;
      images.push({ src, ...(dims.sm && { sm: `/projects/${p.slug}/${name}-sm.webp` }), width: dims.width, height: dims.height });
      // nom de fichier inchangé : on garde la légende exacte (« : » compris), sinon celle du nom
      const fromName = captionOf(path.basename(f));
      const kept = memo.legendes?.[print];
      const caption = kept !== undefined && safe(kept) === fromName ? kept : fromName;
      captions.push(caption);
      legendes[print] = caption;
      if (step !== -1) processus.push(i);
      if (step > 0) etapes[`${name}.webp`] = step;
      fichiers[print] = src;
      process.stdout.write(".");
    }
    for (const old of await fs.readdir(outDir).catch(() => []))
      if (/^\d+(-sm)?\.webp$/.test(old)) await fs.rm(path.join(outDir, old));
    await fs.mkdir(outDir, { recursive: true });
    for (const n of await fs.readdir(tmp)) await fs.rename(path.join(tmp, n), path.join(outDir, n));
    await fs.rm(tmp, { recursive: true, force: true });

    renumeroter(p.slug, remap);
    // vidéo 3D en boucle : la première vidéo du dossier produit, en tête de l'onglet produit
    const boucle = (await fs.readdir(path.join(dir, PRODUIT)).catch(() => [])).filter((n) => VIDEO.test(n)).sort(natural)[0];
    const vOut = path.join(PUBLIC, "videos", `${p.slug}-boucle`);
    if (boucle) {
      const src = path.join(dir, PRODUIT, boucle);
      const print = await sha1(src);
      if (memo.boucle !== print || !(await exists(`${vOut}.mp4`))) {
        await fs.mkdir(path.dirname(vOut), { recursive: true });
        // H.264 muet, 1600 px au plus, lecture dès le début du téléchargement ; image d'attente = première image
        execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", src, "-an", "-vf", "scale='min(1600,iw)':-2", "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${vOut}.mp4`]);
        execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", `${vOut}.mp4`, "-frames:v", "1", "-q:v", "3", `${vOut}.jpg`]);
      }
      memo.boucle = print;
      boucles.add(p.slug);
    } else if (boucles.delete(p.slug)) {
      delete memo.boucle;
      await fs.rm(`${vOut}.mp4`, { force: true });
      await fs.rm(`${vOut}.jpg`, { force: true });
    }
    p.images = images;
    const tFile = path.join(TEXTS, `${p.slug}.json`);
    const t = await readJson(tFile, { slug: p.slug, year: null, context: null, themes: [], intro: "", captions: [] });
    t.captions = captions;
    if (processus.length) t.processus = processus;
    else delete t.processus;
    if (Object.keys(etapes).length) t.etapes = etapes;
    else delete t.etapes;
    const notes = lireNotes(await fs.readFile(path.join(dir, NOTES), "utf8").catch(() => ""));
    if (Object.keys(notes).length) t.notesEtapes = notes;
    else delete t.notesEtapes;
    await writeJson(tFile, t);
    await writeJson(path.join(dir, "_atelier.json"), { depot: await repoPrints(p), fichiers, legendes, ...(memo.boucle && { boucle: memo.boucle }) });
    done.push(p.slug);
    console.log(` ${p.slug} : ${images.length} planches (${reused} reprises telles quelles)`);
  }
  if (!done.length) return console.log("Rien à publier.");
  await fs.writeFile(DATA, JSON.stringify(projects, null, 2));
  await writeJson(METHODE_FILE, METHODE);
  if (boucles.size) site.boucles = [...boucles].sort();
  else delete site.boucles;
  await writeJson(SITE_FILE, site);

  if (flags.has("--sans-pousser")) return console.log("Écrit dans le dépôt, sans commit (--sans-pousser).");
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, stdio: "inherit" });
  git("add", "-A", "src/data/projects.json", "src/data/pages/processus.json", "src/data/site.json", "public/videos", ...done.flatMap((s) => [`public/projects/${s}`, `src/data/texts/${s}.json`]));
  git("commit", "-m", `Atelier : ${done.join(", ")} publié${done.length > 1 ? "s" : ""} depuis Google Drive`);
  git("pull", "--rebase");
  git("push", "origin", "main");
  console.log("Poussé sur GitHub : le site se met à jour dans une ou deux minutes.");
  await etat();
}

if (cmd === "tirer") await tirer();
else if (cmd === "etat") await etat();
else if (cmd === "publier") await publier();
else {
  console.log("Usage : node scripts/atelier.mjs tirer|etat|publier [projet…] [--ecraser] [--sans-pousser] [--forcer]");
  process.exit(1);
}
