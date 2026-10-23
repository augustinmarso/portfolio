import type { Project } from "@/lib/projects";

// Mise en page du canvas de l'index, partagée avec la page d'accueil (préchargement des
// premières vignettes dans le HTML, avant même le JavaScript).

const COLS = 5;
export const LABEL = 22; // hauteur réservée au titre sous chaque carte

export type Placed = { project: Project; x: number; y: number; w: number; h: number };

// Une « tuile » contient tous les projets en colonnes décalées ; on la répète
// dans les deux sens et on replie le décalage modulo sa taille pour boucler.
// Les images gardent leurs proportions exactes (aucun recadrage) : chaque projet va
// dans la colonne la plus courte, et le reste de hauteur est réparti dans les écarts.
export function layoutTile(projects: Project[], vw: number) {
  const gap = vw < 640 ? 40 : vw < 1024 ? 56 : 72;
  // Ordinateur : les colonnes remplissent exactement la largeur de l'écran (aucune carte coupée
  // sur les côtés) ; téléphone : cartes de taille fixe, on glisse pour voir les autres colonnes.
  const cardW = vw < 640 ? 150 : Math.min(320, Math.round(vw / COLS - gap));
  const natural = (p: Project) => Math.round(cardW * (p.cover.height / p.cover.width));

  const columns: Project[][] = Array.from({ length: COLS }, () => []);
  const sums = Array(COLS).fill(0);
  // Du plus haut au plus petit : la répartition gloutonne équilibre bien mieux les colonnes.
  [...projects].sort((a, b) => natural(b) - natural(a)).forEach((p) => {
    const c = sums.indexOf(Math.min(...sums));
    columns[c].push(p);
    sums[c] += natural(p) + LABEL + gap;
  });
  const tileH = Math.ceil(Math.max(...sums));
  const tileW = COLS * (cardW + gap);

  const placed: Placed[] = [];
  columns.forEach((col, c) => {
    const used = col.reduce((s, p) => s + natural(p) + LABEL, 0);
    const colGap = (tileH - used) / col.length; // ≥ gap, la colonne remplit exactement la tuile
    // quinconce : une colonne sur deux descend d'une demi-carte, sans laisser de grand vide
    let y = c % 2 ? (natural(col[0]) + LABEL + colGap) / 2 : 0;
    col.forEach((p) => {
      const h = natural(p) + LABEL;
      placed.push({ project: p, x: c * (cardW + gap), y, w: cardW, h });
      y += h + colGap;
    });
  });
  return { placed, tileW, tileH, gap };
}

// Position de départ de la vue : colonnes centrées dans la largeur, haut de la tuile sous l'en-tête.
export const startOffset = (vw: number, tileW: number, gap: number) => ({ x: (vw - tileW + gap) / 2, y: 88 });

// Vignettes visibles à l'arrivée : sur ordinateur toutes les colonnes tiennent dans la largeur,
// sur téléphone environ deux colonnes du milieu.
export function firstVisible(projects: Project[], vw: number, vh: number) {
  const { placed, tileW, gap } = layoutTile(projects, vw);
  const o = startOffset(vw, tileW, gap);
  return placed
    .filter((p) => p.y + o.y < vh && p.x + o.x + p.w > 0 && p.x + o.x < vw)
    .map((p) => p.project);
}
