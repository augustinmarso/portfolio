// Informations du site pour le référencement (titres, partages, sitemap, données structurées).
export const SITE_URL = "https://augustinmarso.github.io/portfolio";
export const SITE_NAME = "Augustin Marsollier";
export const SITE_DESCRIPTION =
  "Portfolio d'Augustin Marsollier, designer objet et service, étudiant en DSAA Design Produit à l'ENSAAMA (Paris) : objets, jeux, mobilier, services et prototypes.";

// Adresse absolue d'une page du site (chemin sans le préfixe /portfolio).
export const absolute = (path = "/") => `${SITE_URL}${path === "/" ? "/" : path}`;

// Image de partage (1200 × 630, JPG) d'un projet ou du site.
export const ogImage = (slug = "site") => `${SITE_URL}/og/${slug}.jpg`;

// Texte court pour une balise description (≈ 155 caractères, coupé au mot).
export const excerpt = (text: string, max = 155) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

// Sérialise des données structurées sans permettre de fermer la balise <script>.
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Augustin Marsollier",
  jobTitle: "Designer objet et service",
  url: SITE_URL,
  email: "mailto:marsollier.augustin@gmail.com",
  affiliation: { "@type": "CollegeOrUniversity", name: "ENSAAMA", url: "https://www.ensaama.net" },
  address: { "@type": "PostalAddress", addressLocality: "Paris", addressCountry: "FR" },
  sameAs: ["https://www.instagram.com/augustin_marsollier/", "https://www.behance.net/augustimarsoll1"],
};
