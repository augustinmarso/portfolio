// Visuels produit générés par l'IA d'images d'OpenAI, à partir des images de l'objet et des références.
//
//   <atelier>/<projet>/_sources/      images de l'objet à reproduire fidèlement (rendus 3D, photos du prototype) ;
//                                     vide : les premières planches du dossier « produit »
//   <atelier>/<projet>/_references/   images d'ambiance à imiter (Pinterest, Instagram…) : lumière, cadrage, fond, style
//
// Usage (depuis C:\claude\portfolio) :
//   node scripts/rendu.mjs <projet> <plan> [--consigne "texte"] [--qualite low|medium|high] [--format carre|paysage|portrait]
// Plans produit : situation, eclate, packaging, cmf, fond → <projet>/produit/.
// Plans processus (format du carrousel, 4:3) : formes, croquis, pistes, mecanisme, storyboard → dossier de l'étape.
// Le fichier est nommé d'après le plan (« 21 mise en situation (généré).png ») : il suffit ensuite de publier l'atelier.
// Clé : OPENAI_API_KEY (variable d'environnement ou ~/.config/watch/.env). Modèle : RENDU_MODELE.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ATELIER = process.env.ATELIER_PORTFOLIO ?? "G:\\Mon Drive\\Atelier portfolio";
const MODELE = process.env.RENDU_MODELE ?? "gpt-image-2.5-sunburst";
const EXT = /\.(jpe?g|png|webp)$/i;
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
// carrousel : cadre 4:3 du carrousel de la page Processus
const FORMATS = { carre: "1024x1024", paysage: "1536x1024", portrait: "1024x1536", carrousel: "1536x1152" };
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const METHODE = JSON.parse(await fs.readFile(path.join(import.meta.dirname, "../src/data/pages/processus.json"), "utf8"));
const stepDir = (n) => `${n}-${slugify(METHODE.etapes[n - 1].titre)}`;

// Faux croquis : consignes tirées des tutoriels de croquis de design industriel (construction en perspective,
// ellipses, traits de construction légers puis contour appuyé, ombres au feutre gris, annotations).
const CROQUIS =
  "Hand-drawn industrial design sketch on white marker paper, as in professional product design sketching tutorials: light construction lines and perspective guidelines, accurate ellipses, confident line weight hierarchy (thin construction, heavier silhouette), cool grey marker shading with a single accent color, short handwritten annotations and arrows in French. Looks like a real designer's page, slightly imperfect, not a 3D render.";

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
  // --- processus (dossier de l'étape, format carrousel) ---
  formes: {
    nom: "recherche de formes",
    etape: 2,
    libre: true,
    prompt: `Shape research page: a grid of 12 to 16 small silhouette and volume variations exploring the overall form of the product (proportions, profiles, radii), thumbnails drawn quickly. ${CROQUIS}`,
  },
  croquis: {
    nom: "croquis de recherche",
    etape: 3,
    libre: true,
    prompt: `Exploration sketch page of the product: three-quarter view, side view and detail callouts of how it is held and used. ${CROQUIS}`,
  },
  pistes: {
    nom: "trois pistes",
    etape: 3,
    libre: true,
    prompt: `Design directions board: three distinct design concepts for the product side by side, labelled "piste 1", "piste 2", "piste 3", each in three-quarter view with a few annotations on its principle. ${CROQUIS}`,
  },
  mecanisme: {
    nom: "recherche technique",
    etape: 3,
    libre: true,
    prompt: `Technical research sketch page: assembly and fastening principles of the product (screws, threads, clasps, hinges, snap fits) as section views and exploded details, with arrows showing the motion of each part. ${CROQUIS}`,
  },
  storyboard: {
    nom: "storyboard d'usage",
    etape: 3,
    libre: true,
    prompt: `Six-panel usage storyboard drawn as quick sketches, showing a person using the product step by step in its real context, one short French caption under each panel. ${CROQUIS}`,
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
// ce qu'est l'objet (texte de présentation du projet), sans quoi le modèle devine et se trompe d'usage
const texte = JSON.parse(await fs.readFile(path.join(import.meta.dirname, `../src/data/texts/${slug}.json`), "utf8").catch(() => "{}"));
const prompt = [
  texte.intro && `Product description (in French): ${texte.intro}`,
  // processus : l'objet sert de point d'arrivée, les croquis le cherchent sans le copier à l'identique
  p.libre ? "The first images show the final product: the drawings explore ideas leading to it, consistent with its function, parts and materials." : FIDELE,
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
form.append("size", FORMATS[opt("format", p.etape ? "carrousel" : plan === "eclate" || plan === "situation" ? "paysage" : "carre")] ?? "1024x1024");
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

const target = path.join(dir, p.etape ? stepDir(p.etape) : "produit");
await fs.mkdir(target, { recursive: true });
const n = (await fs.readdir(target).catch(() => [])).filter((f) => EXT.test(f)).length + 1;
const file = path.join(target, `${String(n).padStart(2, "0")} ${p.nom} (généré).png`);
await fs.writeFile(file, Buffer.from(out.data[0].b64_json, "base64"));
console.log(`✓ ${file}\n  À relire avant de publier ; pour une autre version, relancer (avec --consigne pour corriger).`);
