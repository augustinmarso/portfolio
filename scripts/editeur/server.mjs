// Éditeur local du portfolio : ne répond qu'à cet ordinateur (127.0.0.1).
// Lancement : pnpm editeur  (ou double-clic sur Editeur.cmd) puis http://localhost:5310
// Les suppressions ne détruisent rien : les fichiers partent dans <behance>/_corbeille.
import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../.."); // dossier du portfolio
const SRC = path.resolve(ROOT, "../behance"); // images sources, un dossier par projet
const TEXTS = path.join(ROOT, "src/data/texts");
const SITE_FILE = path.join(ROOT, "src/data/site.json");
const TRASH = path.join(SRC, "_corbeille");
const PORT = 5310;
const EXT = /\.(jpe?g|png|gif|webp)$/i;

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const readJson = async (f, fallback) => {
  try {
    return JSON.parse(await fs.readFile(f, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (f, data) => fs.writeFile(f, JSON.stringify(data, null, 2) + "\n");
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

async function folders() {
  const dirs = (await fs.readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory() && !d.name.startsWith("_"));
  return Object.fromEntries(dirs.map((d) => [slugify(d.name), d.name]));
}
async function imagesOf(folder) {
  return (await fs.readdir(path.join(SRC, folder))).filter((f) => EXT.test(f)).sort();
}
const emptyText = () => ({ year: null, context: null, themes: [], intro: "", captions: [], processus: [] });

async function state() {
  const site = await readJson(SITE_FILE, { order: [], titles: {}, covers: {}, videos: [] });
  const map = await folders();
  const rank = (s) => (site.order.includes(s) ? site.order.indexOf(s) : 1e6);
  const projects = [];
  for (const slug of Object.keys(map).sort((a, b) => rank(a) - rank(b))) {
    const text = await readJson(path.join(TEXTS, `${slug}.json`), emptyText());
    projects.push({
      slug,
      folder: map[slug],
      title: site.titles[slug] ?? map[slug],
      cover: site.covers[slug] ?? null,
      images: await imagesOf(map[slug]),
      text,
    });
  }
  return { projects };
}

// Renumérote 01, 02… dans l'ordre donné, déplace les légendes et le classement produit/processus
// avec les images et suit la couverture si elle désigne un numéro d'image.
// capOf : légende et onglet de chaque fichier ; par défaut lus dans l'ordre actuel du dossier.
async function captionsByFile(slug, folder) {
  const text = await readJson(path.join(TEXTS, `${slug}.json`), emptyText());
  return Object.fromEntries(
    (await imagesOf(folder)).map((f, i) => [f, { cap: text.captions?.[i] ?? "", proc: (text.processus ?? []).includes(i) }])
  );
}
async function renumber(slug, folder, ordered, capOf) {
  const site = await readJson(SITE_FILE, {});
  const tf = path.join(TEXTS, `${slug}.json`);
  const text = await readJson(tf, emptyText());
  capOf ??= await captionsByFile(slug, folder);
  const tmp = [];
  for (const [i, f] of ordered.entries()) {
    const t = `__tmp_${i}${path.extname(f).toLowerCase()}`;
    await fs.rename(path.join(SRC, folder, f), path.join(SRC, folder, t));
    tmp.push([t, f]);
  }
  const renamed = {};
  for (const [i, [t, orig]] of tmp.entries()) {
    const name = `${String(i + 1).padStart(2, "0")}${path.extname(t)}`;
    await fs.rename(path.join(SRC, folder, t), path.join(SRC, folder, name));
    renamed[path.parse(orig).name] = String(i + 1).padStart(2, "0");
  }
  text.captions = ordered.map((f) => capOf[f]?.cap ?? "");
  text.processus = ordered.flatMap((f, i) => (capOf[f]?.proc ? [i] : []));
  await writeJson(tf, text);
  const c = site.covers?.[slug];
  if (c && c !== "_covers") {
    site.covers[slug] = renamed[c] ?? "01";
    await writeJson(SITE_FILE, site);
  }
}

async function toTrash(rel, src) {
  const dst = path.join(TRASH, stamp(), rel);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.rename(src, dst);
  return dst;
}

const readBody = (req) =>
  new Promise((ok, ko) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => ok(Buffer.concat(chunks)));
    req.on("error", ko);
  });

// Miniatures pour l'interface (mises en cache en mémoire).
const thumbs = new Map();
async function thumb(folder, file) {
  const key = `${folder}/${file}`;
  const p = path.join(SRC, folder, file);
  const mtime = (await fs.stat(p)).mtimeMs;
  const hit = thumbs.get(key);
  if (hit && hit.mtime === mtime) return hit.buf;
  const buf = await sharp(p, { limitInputPixels: false }).rotate().resize(360, 360, { fit: "inside" }).webp({ quality: 70 }).toBuffer();
  thumbs.set(key, { mtime, buf });
  return buf;
}

let publishing = false;
function run(cmd, args, log) {
  return new Promise((ok, ko) => {
    const p = spawn(cmd, args, { cwd: ROOT, shell: true });
    p.stdout.on("data", (d) => log(d.toString()));
    p.stderr.on("data", (d) => log(d.toString()));
    p.on("close", (code) => (code === 0 ? ok() : ko(new Error(`${cmd} ${args.join(" ")} → code ${code}`))));
  });
}

const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  // Sécurité : uniquement les requêtes venues de cet ordinateur, depuis la page de l'éditeur.
  const origin = req.headers.origin;
  if (origin && origin !== `http://localhost:${PORT}` && origin !== `http://127.0.0.1:${PORT}`) return send(res, 403, { error: "origine refusée" });
  const url = new URL(req.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  try {
    if (req.method === "GET" && url.pathname === "/") {
      return send(res, 200, await fs.readFile(path.join(HERE, "index.html")), "text/html; charset=utf-8");
    }
    if (req.method === "GET" && parts[0] === "thumb") {
      return send(res, 200, await thumb(parts[1], parts[2]), "image/webp");
    }
    if (req.method === "GET" && url.pathname === "/api/state") return send(res, 200, await state());

    if (req.method !== "POST" || parts[0] !== "api") return send(res, 404, { error: "introuvable" });
    const map = await folders();
    const body = await readBody(req);
    const json = () => JSON.parse(body.toString("utf8") || "{}");

    // Ordre des projets
    if (parts[1] === "order") {
      const site = await readJson(SITE_FILE, {});
      site.order = json().order;
      await writeJson(SITE_FILE, site);
      return send(res, 200, { ok: true });
    }
    // Nouveau projet
    if (parts[1] === "new") {
      const title = String(json().title ?? "").trim();
      if (!title) return send(res, 400, { error: "titre vide" });
      const folder = title.replace(/[<>:"/\\|?*]/g, "").trim();
      const slug = slugify(folder);
      if (map[slug]) return send(res, 400, { error: "un projet porte déjà ce nom" });
      await fs.mkdir(path.join(SRC, folder), { recursive: true });
      await writeJson(path.join(TEXTS, `${slug}.json`), emptyText());
      const site = await readJson(SITE_FILE, {});
      site.titles = { ...site.titles, [slug]: title };
      site.order = [slug, ...(site.order ?? [])];
      await writeJson(SITE_FILE, site);
      return send(res, 200, { ok: true, slug });
    }
    // Publication : images du site, contrôle, puis envoi sur GitHub
    if (parts[1] === "publish") {
      if (publishing) return send(res, 409, { error: "publication déjà en cours" });
      publishing = true;
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      const log = (t) => res.write(t);
      try {
        log("→ Images du site…\n");
        await run("node", ["scripts/optimize-images.mjs", "../behance"], (t) => log(t.replace(/\.+/g, "")));
        log("→ Vérification du code…\n");
        await run("pnpm", ["exec", "tsc", "--noEmit"], log);
        log("→ Envoi sur GitHub…\n");
        await run("git", ["add", "-A"], log);
        await run("git", ["commit", "-m", `"Modifications depuis l'éditeur local (${new Date().toLocaleString("fr-FR")})"`], log).catch(() =>
          log("(rien de nouveau à publier)\n")
        );
        await run("git", ["push"], log);
        log("\n✓ Envoyé. Le site en ligne se met à jour dans 1 à 2 minutes.\n");
      } catch (e) {
        log(`\n✗ ${e.message}\n`);
      } finally {
        publishing = false;
        res.end();
      }
      return;
    }

    // Actions sur un projet
    const slug = parts[1];
    const folder = map[slug];
    if (!folder) return send(res, 404, { error: "projet introuvable" });
    const action = parts[2];

    if (action === "text") {
      const { title, ...text } = json();
      await writeJson(path.join(TEXTS, `${slug}.json`), { ...(await readJson(path.join(TEXTS, `${slug}.json`), {})), ...text });
      const site = await readJson(SITE_FILE, {});
      site.titles = { ...site.titles, [slug]: title };
      await writeJson(SITE_FILE, site);
      return send(res, 200, { ok: true });
    }
    if (action === "reorder") {
      const files = json().files;
      const current = await imagesOf(folder);
      if (files.length !== current.length || files.some((f) => !current.includes(f))) return send(res, 400, { error: "liste d'images incohérente" });
      await renumber(slug, folder, files);
      return send(res, 200, { ok: true });
    }
    if (action === "delete-image") {
      const file = json().file;
      const current = await imagesOf(folder);
      if (!current.includes(file)) return send(res, 404, { error: "image introuvable" });
      const capOf = await captionsByFile(slug, folder); // avant de retirer l'image
      await toTrash(path.join(folder, file), path.join(SRC, folder, file));
      const site = await readJson(SITE_FILE, {});
      if (site.covers?.[slug] === path.parse(file).name) {
        site.covers[slug] = "01";
        await writeJson(SITE_FILE, site);
      }
      await renumber(slug, folder, current.filter((f) => f !== file), capOf);
      return send(res, 200, { ok: true });
    }
    if (action === "add-image") {
      const name = decodeURIComponent(req.headers["x-filename"] ?? "image.jpg");
      const ext = (path.extname(name) || ".jpg").toLowerCase();
      if (!EXT.test(ext)) return send(res, 400, { error: "format non pris en charge" });
      const current = await imagesOf(folder);
      const n = current.length + 1;
      await fs.writeFile(path.join(SRC, folder, `${String(n).padStart(2, "0")}${ext}`), body);
      const tf = path.join(TEXTS, `${slug}.json`);
      const text = await readJson(tf, emptyText());
      text.captions = [...(text.captions ?? []).slice(0, current.length), ""];
      await writeJson(tf, text);
      return send(res, 200, { ok: true });
    }
    if (action === "cover") {
      const site = await readJson(SITE_FILE, {});
      site.covers = { ...site.covers, [slug]: path.parse(json().file).name };
      await writeJson(SITE_FILE, site);
      return send(res, 200, { ok: true });
    }
    if (action === "delete") {
      await toTrash(folder, path.join(SRC, folder));
      const tf = path.join(TEXTS, `${slug}.json`);
      if (existsSync(tf)) await toTrash(`textes/${slug}.json`, tf);
      const site = await readJson(SITE_FILE, {});
      site.order = (site.order ?? []).filter((s) => s !== slug);
      await writeJson(SITE_FILE, site);
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: "action inconnue" });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: e.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Éditeur du portfolio : http://localhost:${PORT}  (Ctrl+C pour arrêter)`);
});
