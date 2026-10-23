// Visuels produit générés par l'IA d'images d'OpenAI, à partir des images de l'objet et des références.
//
//   <atelier>/<projet>/_sources/      images de l'objet à reproduire fidèlement (rendus 3D, photos du prototype) ;
//                                     vide : les premières planches du dossier « produit »
//   <atelier>/<projet>/_references/   images d'ambiance à imiter (Pinterest, Instagram…) : lumière, cadrage, fond, style
//
// Usage (depuis C:\claude\portfolio) :
//   node scripts/rendu.mjs <projet> <plan> [--consigne "texte"] [--qualite low|medium|high] [--format carre|paysage|portrait]
// Plans : situation, eclate, packaging, cmf, fond (voir PLANS). Le résultat arrive dans <projet>/produit/,
// nommé d'après le plan (« 21 mise en situation (généré).png ») : il suffit ensuite de publier l'atelier.
// Clé : OPENAI_API_KEY (variable d'environnement ou ~/.config/watch/.env). Modèle : RENDU_MODELE.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ATELIER = process.env.ATELIER_PORTFOLIO ?? "G:\\Mon Drive\\Atelier portfolio";
const MODELE = process.env.RENDU_MODELE ?? "gpt-image-2.5-sunburst";
const EXT = /\.(jpe?g|png|webp)$/i;
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const FORMATS = { carre: "1024x1024", paysage: "1536x1024", portrait: "1024x1536" };

const FIDELE =
  "The object in the first images is the exact product to show: keep its geometry, proportions, parts, colors, materials, finishes and logo exactly as they are, do not redesign it.";
// Plans de la série produit : nom de fichier (repéré par l'état de l'atelier) et consigne de rendu.
const PLANS = {
  situation: {
    nom: "mise en situation",
    prompt: "Photorealistic lifestyle photograph of the product in use, in a believable real setting matching its purpose, natural light, editorial product photography.",
  },
  eclate: {
    nom: "éclaté",
    prompt: "Clean exploded view of the product: each part separated along its assembly axis with even spacing, aligned and floating, studio light on a seamless light background, technical yet elegant product rendering.",
  },
  packaging: {
    nom: "packaging",
    prompt: "Photorealistic packaging shot: the product next to its box or packaging designed in the same visual identity, simple sustainable cardboard, studio product photography.",
  },
  cmf: {
    nom: "couleur matière finition",
    prompt: "Close-up macro photograph focused on colors, materials and finishes (CMF) of the product: texture of each material, edges, joints and surface finish, soft raking light showing the grain.",
  },
  fond: {
    nom: "fond",
    prompt: "Hero product photograph of the product alone on a background, lighting, framing and color grading as close as possible to the reference images.",
  },
};

const [slug, plan, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? fallback : rest[i + 1];
};
if (!slug || !PLANS[plan]) {
  console.log(`Usage : node scripts/rendu.mjs <projet> <${Object.keys(PLANS).join("|")}> [--consigne "…"] [--qualite low|medium|high] [--format carre|paysage|portrait]`);
  process.exit(1);
}

async function cle() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = await fs.readFile(path.join(os.homedir(), ".config/watch/.env"), "utf8").catch(() => "");
  const k = env.match(/^OPENAI_API_KEY=["']?([^"'\r\n]+)/m)?.[1];
  if (!k) throw new Error("Clé OPENAI_API_KEY introuvable (variable d'environnement ou ~/.config/watch/.env).");
  return k;
}

const dir = path.join(ATELIER, slug);
const list = async (d) =>
  (await fs.readdir(d).catch(() => [])).filter((n) => EXT.test(n)).sort((a, b) => a.localeCompare(b, "fr", { numeric: true })).map((n) => path.join(d, n));
await fs.mkdir(path.join(dir, "_sources"), { recursive: true });
await fs.mkdir(path.join(dir, "_references"), { recursive: true });
const sources = (await list(path.join(dir, "_sources"))).slice(0, 4);
const objet = sources.length ? sources : (await list(path.join(dir, "produit"))).filter((f) => !/\(généré\)/.test(f)).slice(0, 3);
const refs = (await list(path.join(dir, "_references"))).slice(0, 4);
if (!objet.length) throw new Error(`Aucune image de l'objet : ajouter des images dans ${path.join(dir, "_sources")}.`);

const p = PLANS[plan];
const prompt = [
  FIDELE,
  refs.length && `The last ${refs.length} image(s) are style references only: copy their lighting, background, framing, mood and color grading, not their objects.`,
  p.prompt,
  opt("consigne") && `Additional direction: ${opt("consigne")}`,
]
  .filter(Boolean)
  .join(" ");

const form = new FormData();
form.append("model", MODELE);
form.append("prompt", prompt);
form.append("quality", opt("qualite", "high"));
form.append("size", FORMATS[opt("format", plan === "eclate" || plan === "situation" ? "paysage" : "carre")] ?? "1024x1024");
for (const f of [...objet, ...refs])
  form.append("image[]", new Blob([await fs.readFile(f)], { type: MIME[path.extname(f).toLowerCase()] }), path.basename(f));

console.log(`→ ${slug} · ${p.nom} : ${objet.length} image(s) de l'objet, ${refs.length} référence(s), modèle ${MODELE}…`);
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${await cle()}` },
  body: form,
});
const out = await res.json();
if (!res.ok) throw new Error(`OpenAI ${res.status} : ${out.error?.message ?? JSON.stringify(out)}`);

const produit = path.join(dir, "produit");
const n = (await fs.readdir(produit).catch(() => [])).filter((f) => EXT.test(f)).length + 1;
const file = path.join(produit, `${String(n).padStart(2, "0")} ${p.nom} (généré).png`);
await fs.writeFile(file, Buffer.from(out.data[0].b64_json, "base64"));
console.log(`✓ ${file}\n  À relire avant de publier ; pour une autre version, relancer (avec --consigne pour corriger).`);
