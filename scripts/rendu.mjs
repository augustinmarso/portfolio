// Retouche d'images avec l'IA d'images d'OpenAI, limitée à deux usages (le générateur ne crée ni planche,
// ni croquis, ni visuel produit : tout le reste vient du travail réel, rendus 3D et photos) :
//
//   retirer     enlever un objet d'une photo, pour y intégrer ensuite l'objet du projet
//   personnage  ajouter une personne sur un rendu 3D (mise en situation), sans toucher à l'objet
//
// Usage (depuis C:\claude\portfolio) :
//   node scripts/rendu.mjs retirer <image> "ce qu'il faut retirer" [--qualite low|medium|high]
//   node scripts/rendu.mjs personnage <rendu> "qui, et ce qu'il fait" [--personne photo.jpg] [--qualite …]
// Le résultat est écrit à côté de l'image d'origine : « <nom> (retouché).png ». Au même format que l'original.
// Clé : OPENAI_API_KEY (variable d'environnement ou ~/.config/watch/.env). Modèle : RENDU_MODELE.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const MODELE = process.env.RENDU_MODELE ?? "gpt-image-2.5-sunburst";
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// Rien d'autre que la retouche demandée : le reste de l'image doit rester identique autant que possible.
const GARDER =
  "Edit only what is asked. Keep everything else in the image exactly as it is: same framing, perspective, lighting, colors, materials, textures and every other object. Do not redesign, restyle or beautify anything.";
const USAGES = {
  retirer: (quoi) =>
    `Remove ${quoi} from the photo and reconstruct the background behind it naturally (surfaces, shadows, reflections), as if it had never been there. ${GARDER}`,
  personnage: (qui, avecPhoto) =>
    `Add ${qui} into this 3D product render, photorealistic, with lighting, shadows, contact points and perspective consistent with the scene${avecPhoto ? ", looking like the person in the last image" : ""}. The product in the render must stay exactly unchanged: same shape, parts, colors and finishes. ${GARDER}`,
};

const [usage, image, consigne, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? fallback : rest[i + 1];
};
if (!USAGES[usage] || !image || !consigne) {
  console.log('Usage : node scripts/rendu.mjs retirer <image> "ce qu\'il faut retirer"');
  console.log('        node scripts/rendu.mjs personnage <rendu> "qui, et ce qu\'il fait" [--personne photo.jpg]');
  process.exit(1);
}

async function cle() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = await fs.readFile(path.join(os.homedir(), ".config/watch/.env"), "utf8").catch(() => "");
  const k = env.match(/^OPENAI_API_KEY=["']?([^"'\r\n]+)/m)?.[1];
  if (!k) throw new Error("Clé OPENAI_API_KEY introuvable (variable d'environnement ou ~/.config/watch/.env).");
  return k;
}

// Taille de sortie au rapport de l'original : côtés multiples de 16, rapport entre 1:3 et 3:1, ~2,4 Mpx.
async function tailleDe(f) {
  const { width, height } = await sharp(f).metadata();
  const ratio = Math.min(3, Math.max(1 / 3, width / height));
  const h = Math.sqrt(2_400_000 / ratio);
  const r16 = (x) => Math.max(16, Math.round(x / 16) * 16);
  return `${r16(h * ratio)}x${r16(h)}`;
}

// formats acceptés par l'API : JPEG, PNG, WebP ; les autres sont convertis en PNG
const blob = async (f) => {
  const type = MIME[path.extname(f).toLowerCase()];
  return type ? new Blob([await fs.readFile(f)], { type }) : new Blob([await sharp(f).png().toBuffer()], { type: "image/png" });
};

const personne = opt("personne");
const form = new FormData();
form.append("model", MODELE);
form.append("prompt", USAGES[usage](consigne, !!personne));
form.append("quality", opt("qualite", "high"));
form.append("size", await tailleDe(image));
form.append("image[]", await blob(image), path.basename(image));
if (usage === "personnage" && personne) form.append("image[]", await blob(personne), path.basename(personne));

console.log(`→ ${usage} : ${path.basename(image)} (${MODELE})…`);
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${await cle()}` },
  body: form,
});
const out = await res.json();
if (!res.ok) throw new Error(`OpenAI ${res.status} : ${out.error?.message ?? JSON.stringify(out)}`);

const file = path.join(path.dirname(image), `${path.basename(image, path.extname(image))} (retouché).png`);
await fs.writeFile(file, Buffer.from(out.data[0].b64_json, "base64"));
console.log(`✓ ${file}\n  À comparer avec l'original avant de l'utiliser.`);
