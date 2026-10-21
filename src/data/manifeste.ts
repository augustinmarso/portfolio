// Manifeste d'Augustin Marsollier (DSAA ENSAAMA, 2026), repris du PDF « Manifeste Augustin Marsollier ».
// Portraits des trois designers favoris recadrés depuis le PDF (public/manifeste).
// Dans les textes, [n] renvoie à la note n ; [[texte|/projets/slug]] fait un lien vers un projet.

export const TITRE = "matérialisme énergétique[1], décroissance du design et croissance spirituelle";

export const EXERGUE = {
  texte:
    "« On ne comprend absolument rien à la civilisation moderne si l'on n'admet pas d'abord qu'elle est une conspiration universelle contre toute espèce de vie intérieure. »",
  source: "Georges Bernanos, La France contre les robots (1947)",
};

export type Section = { id: string; titre: string; paragraphes?: string[]; liste?: { nom: string; detail: string; texte?: string; photo?: string }[] };

export const SECTIONS: Section[] = [
  {
    id: "foi",
    titre: "foi et création",
    paragraphes: [
      "Je suis catholique. Je m'excuse d'avance si cela paraît prosélyte, mais comme la spiritualité guide beaucoup de mes choix, elle se répercute naturellement sur mon design. En principe, ma vision est fondamentalement anti-moderne[2] : elle s'oppose à l'innovation, au progrès technique et à la croissance infinie. L'existence humaine de subsistance offerte par Dieu devrait me suffire, sans que j'aie besoin de me perdre dans les chimères de la production.",
      "Mais voilà : je suis créatif, et créer des objets m'amuse. En règle générale, je vais là où je m'amuse. J'adore les systèmes, les interfaces, les objets techniques et le jeu, qui constitue lui-même un système. Le ludique m'intéresse tout particulièrement. Mais comme le soulignait Clouscard, c'est le ludique qui crée chez les enfants la dépendance et l'addiction à la consommation. Le designer doit donc se réinventer, car rendre la surconsommation désirable n'est plus moral à une époque où la planète doit se défaire de cette addiction.",
    ],
  },
  {
    id: "fin",
    titre: "la fin d'un modèle",
    paragraphes: [
      "En effet, l'industrialisation et le monde moderne ont « tué Dieu »[3] et vu naître le design industriel. Aujourd'hui, je crois que nous vivons la fin de ce modèle. Le design est né avec les énergies fossiles ; il disparaîtra avec elles. Nous faisons face au pic du pétrole[4]. Cette décroissance énergétique, il nous faut l'accélérer si nous voulons éviter un réchauffement climatique dévastateur. Nous devons donc préparer la décroissance du métier de designer. Cela exige de produire mieux, mais surtout beaucoup moins.",
      "Je ne crois pas à l'innovation de rupture[5] qui nous permettrait de continuer à produire de la même manière. Si l'on embauche aujourd'hui moins de jeunes designers, ce n'est pas seulement dû à une crise conjoncturelle[6] du capitalisme, mais à la difficulté croissante d'extraire du pétrole. Moins de pétrole, c'est moins d'objets produits chaque année, donc mécaniquement moins de designers pour les concevoir : il va falloir être très bon !",
    ],
  },
  {
    id: "ia",
    titre: "l'intelligence artificielle",
    paragraphes: [
      "Un autre phénomène majeur vient accélérer cette mutation : l'arrivée de l'intelligence artificielle (même si elle va devoir décroître aussi). L'IA vient bousculer chaque étape de la création. Selon moi, l'IA est réellement créative : si la créativité réside dans l'association d'idées et de concepts différents, c'est précisément ce qu'elle fait par essence. Pourtant, cette créativité n'est pas toujours pertinente : elle associe sans intention, sans vécu et sans responsabilité, et ne remplace pas le regard du designer.",
      "Ce que je trouve passionnant avec l'IA, ce sont les ponts et les traductions qu'elle permet de créer entre les domaines. L'argument moral selon lequel elle « volerait » le travail du designer me paraît un peu hypocrite, quand on sait que le designer a lui-même dépossédé nombre d'artisans et d'ouvriers de leur qualification esthétique[7] en permettant la production de masse à bas coût.",
      "Je pense que l'IA va pousser l'Homme à ne plus se définir par ce qu'il produit ou ce qu'il consomme, ce qui était la fausse promesse et le mensonge de la modernité. Elle va le réorienter vers l'amour qu'il peut donner aux autres et vers une connexion plus profonde à la spiritualité. Face à ces outils génératifs, il devient essentiel pour le designer de développer son propre langage par l'ennui, la répétition, l'erreur, la lecture et l'écriture.",
    ],
  },
  {
    id: "pistes",
    titre: "les pistes",
    paragraphes: [
      "Maintenant que ce constat est posé (un constat assez radical, à la manière de Victor Papanek affirmant en son temps que le design pouvait être mortel), quelles sont les pistes de transformation ?",
      "Il est de notre devoir de réindustrialiser la France sur des bases locales. Ce localisme industriel[8] vise à enraciner la production pour nous prémunir des dérives de la surproduction et retrouver une souveraineté face aux États-Unis, à l'Europe, à la Chine ou à l'automatisation par l'IA. Il intègre aussi l'artisanat, matrice première de notre pratique, afin d'apprendre à vivre dans une société post-carbone[9]. La réponse n'est d'ailleurs peut-être pas toujours un objet : ce peut être un service, qui répond au besoin sans produire davantage.",
      "Un projet qui m'a beaucoup plu dans cette problématique, c'est le projet zéro déchet pour lequel j'ai repris une ancienne pratique de fermentation traditionnelle pour créer une [[yaourtière sans électricité|/projets/kai]] afin de faire un objet qui dure et qui se transmet.",
      "Si cette transition nous mène vers un mode de vie plus sobre, proche par certains aspects de la société médiévale décrite par William Morris ou de celle que perpétuent les Compagnons du devoir, cela ne me rendra pas triste : j'adore la fantasy et l'imaginaire médiéval. Toutes ces perspectives m'enchantent. C'est dans les périodes de rupture et de trouble que l'on écrit l'histoire. Au vu de l'expérience humaine, nous vivons une époque captivante.",
    ],
  },
  {
    id: "designers",
    titre: "mes trois designers favoris",
    liste: [
      { nom: "Léon XIV", detail: "Pape depuis 2025", photo: "/manifeste/leon-xiv.webp" },
      { nom: "Jean-Marc Jancovici", detail: "Ingénieur, fondateur de The Shift Project", photo: "/manifeste/jancovici.webp" },
      { nom: "Michel Clouscard", detail: "Philosophe et sociologue (1928–2009)", photo: "/manifeste/clouscard.webp" },
    ],
  },
  {
    id: "inspirations",
    titre: "projets qui m'inspirent",
    liste: [
      {
        nom: "Re:Mix — Open Funk",
        detail: "Blender open source, modulaire et réparable",
        texte:
          "Re:Mix s'adapte à ce qu'on a déjà : il se visse sur les bocaux de conserve standard de la cuisine au lieu d'imposer son propre bol. Sa base modulaire s'assemble sans colle, par jonctions en puzzle, et se démonte avec des outils courants. Les plans sont open source pour être refabriqués localement.",
      },
      {
        nom: "Baptistère de Notre-Dame de Paris — Guillaume Bardet",
        detail: "Mobilier liturgique en bronze, 2024",
        texte:
          "Pour la cathédrale restaurée, Guillaume Bardet a conçu l'ensemble du mobilier liturgique en bronze, coulé dans une fonderie française. Il dialogue avec la pierre et sa patine évolue avec le temps. Un objet pensé pour durer des siècles, au service du sacré plutôt que de la consommation.",
      },
      {
        nom: "Rotoman — Maximum",
        detail: "Tabouret en polyéthylène recyclé, fabriqué en France",
        texte:
          "Le Rotoman est fait des éprouvettes jetées après les tests de qualité du plastique. Les marques de test, visibles sous l'assise, deviennent l'ornement.",
      },
    ],
  },
];

export const NOTES: { terme: string; texte: string }[] = [
  {
    terme: "Matérialisme énergétique",
    texte:
      "lecture qui place l'énergie au fondement de tout. La quantité d'énergie disponible (pétrole, charbon, gaz) détermine ce qu'une société peut produire, consommer et concevoir, mais aussi ses rapports sociaux et ses structures politiques.",
  },
  { terme: "Anti-moderne", texte: "qui rejette les valeurs de la modernité (progrès technique, croissance, culte de la nouveauté) au profit de la tradition." },
  { terme: "« Tué Dieu »", texte: "formule de Nietzsche (Le Gai Savoir, 1882) pour désigner le recul de la religion au cœur de la société moderne." },
  { terme: "Pic du pétrole", texte: "moment où la production mondiale de pétrole atteint son maximum avant de décliner." },
  { terme: "Innovation de rupture", texte: "technologie nouvelle qui bouleverse un marché ou un usage, présentée comme la solution aux crises." },
  {
    terme: "Crise conjoncturelle",
    texte: "crise passagère, liée à la situation économique du moment, par opposition à une crise structurelle et durable.",
  },
  {
    terme: "Qualification esthétique",
    texte:
      "pour Bernard Stiegler, l'industrie a provoqué une « prolétarisation » : l'ouvrier perd son savoir-faire au profit de la machine, puis le consommateur perd sa capacité à créer et à juger le beau, livré à des formes produites pour lui. Il parle de « misère symbolique ».",
  },
  { terme: "Localisme industriel", texte: "relocalisation de la production au plus près des lieux de consommation." },
  { terme: "Société post-carbone", texte: "société qui ne dépend plus des énergies fossiles (pétrole, gaz, charbon)." },
];

// Ouvrages cités, aussi rangés dans la petite bibliothèque de la page (couleur et format du dos inventés).
export type Ouvrage = { auteur: string; titre: string; detail: string; couleur: string; encre: string; h: number; l: number };

export const OUVRAGES: Ouvrage[] = [
  { auteur: "Bernanos", titre: "La France contre les robots", detail: "Georges Bernanos, 1947", couleur: "#E9E1CF", encre: "#2B2B2B", h: 0.86, l: 34 },
  { auteur: "Clouscard", titre: "Le Capitalisme de la séduction", detail: "Michel Clouscard, Éditions sociales, 1981", couleur: "#9B3A2C", encre: "#F4EEE2", h: 0.94, l: 40 },
  { auteur: "François", titre: "Laudato si'", detail: "Pape François, encyclique sur la sauvegarde de la maison commune, 2015", couleur: "#F2EEE6", encre: "#7A5C1E", h: 0.78, l: 26 },
  { auteur: "Jancovici", titre: "The Shift Project", detail: "Jean-Marc Jancovici, The Shift Project, rapports et publications en libre accès, theshiftproject.org", couleur: "#2F4858", encre: "#EAF0F2", h: 1, l: 46 },
  { auteur: "Léon XIV", titre: "Magnifica humanitas", detail: "Pape Léon XIV, encyclique sur la personne humaine au temps de l'intelligence artificielle, 2026", couleur: "#F7F3EA", encre: "#8C1C1C", h: 0.8, l: 24 },
  { auteur: "Masure", titre: "Design sous artifice", detail: "Anthony Masure, la création au risque du machine learning, HEAD – Publishing, 2023", couleur: "#1E1E1E", encre: "#F2F2F2", h: 0.9, l: 32 },
  { auteur: "Morris", titre: "Nouvelles de nulle part", detail: "William Morris, 1890", couleur: "#4E6145", encre: "#EDE6CF", h: 0.84, l: 36 },
  { auteur: "Papanek", titre: "Design pour un monde réel", detail: "Victor Papanek, 1971", couleur: "#D9A441", encre: "#1E1E1E", h: 0.96, l: 38 },
  { auteur: "Stiegler", titre: "De la misère symbolique", detail: "Bernard Stiegler, Galilée, 2004", couleur: "#E4E0D8", encre: "#3A3A3A", h: 0.88, l: 30 },
  { auteur: "Tesson", titre: "Dans les forêts de Sibérie", detail: "Sylvain Tesson, Gallimard, 2011", couleur: "#5B6F80", encre: "#F4F1EA", h: 0.82, l: 28 },
];
