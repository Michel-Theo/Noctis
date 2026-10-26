/** Journal « Carnets de nuit » : articles de l'atelier (contenu fictif du projet portfolio). */

export type Block =
  | { type: 'lead'; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'images'; images: [string, string] }

export type Article = {
  slug: string
  title: string
  category: 'Atelier' | 'Inspirations' | 'Entretien'
  minutes: number
  date: string
  excerpt: string
  cover: string
  /** Cadrage de la couverture quand elle est recadrée (object-position). */
  coverPosition?: string
  /** Pièce mise en avant en bas d'article. */
  product?: { slug: string; label: string }
  body: Block[]
}

const IMG = '/img/produit'
const V = '/img/vitrine'
const NUIT = `${V}/mains_large.webp`

export const ARTICLES: Article[] = [
  {
    slug: 'vingt-six-lames',
    title: 'Vingt-six lames : la naissance de Couronne I',
    category: 'Atelier',
    minutes: 6,
    date: '2026-10-12',
    excerpt: 'De la première esquisse dans Blender au premier lingot coulé : six semaines pour une bague qui tient debout seule.',
    cover: NUIT,
    product: { slug: 'couronne-i', label: 'Découvrir Couronne I' },
    body: [
      {
        type: 'lead',
        text: 'Tout a commencé par une contrainte : la bague devait tenir debout, seule, posée sur sa tranche. Il fallait donc une colonne vertébrale. Ce serait le poignard.',
      },
      {
        type: 'p',
        text: "Autour de lui, les griffes sont venues une à une. Chaque lame est une courbe de Bézier épaissie en amande, enroulée autour du doigt. À vingt-six, la pièce a cessé de ressembler à un objet pour ressembler à une créature.",
      },
      { type: 'quote', text: '« À vingt-six lames, la bague a cessé d’être un objet. »' },
      { type: 'images', images: [`${IMG}/face_nuit.webp`, `${IMG}/porte_nuit_nuit.webp`] },
      {
        type: 'p',
        text: "La fonte, elle, ne pardonne rien : une lame trop fine et l'argent ne coule pas jusqu'à la pointe. Trois prototypes ont fini au creuset avant que la quatrième sorte entière.",
      },
    ],
  },
  {
    slug: 'porter-l-argent-la-nuit',
    title: "Porter l'argent la nuit",
    category: 'Inspirations',
    minutes: 4,
    date: '2026-09-28',
    excerpt: "Sous un lampadaire, l'argent ne brille pas : il découpe. Pourquoi nos pièces sont pensées pour l'obscurité.",
    cover: `${V}/journal_chaine.webp`,
    coverPosition: '50% 78%',
    product: { slug: 'couronne-i', label: 'Découvrir Couronne I' },
    body: [
      {
        type: 'lead',
        text: "Le jour, l'argent se contente de refléter. La nuit, il choisit. Une seule source de lumière suffit à faire sortir une arête et à plonger le reste dans le noir.",
      },
      {
        type: 'p',
        text: "C'est pour cette lumière-là que nous dessinons. Les lames de Couronne I sont orientées pour accrocher un reflet à la fois : un lampadaire, un écran, la flamme d'un briquet. La bague change de forme selon l'endroit où l'on se tient.",
      },
      { type: 'quote', text: '« Sous un lampadaire, l’argent ne brille pas : il découpe. »' },
      { type: 'images', images: [`${V}/journal_perles.webp`, `${IMG}/porte_nuit_nuit.webp`] },
      {
        type: 'p',
        text: "Le rhodium accentue l'effet : plus blanc que l'argent nu, il donne aux reflets cette froideur de lame. Portée sur une main nue, la pièce devient un signal plus qu'un ornement.",
      },
    ],
  },
  {
    slug: 'pourquoi-le-rhodium',
    title: 'Pourquoi le rhodium',
    category: 'Entretien',
    minutes: 3,
    date: '2026-09-14',
    excerpt: "Un voile de métal précieux, quelques microns d'épaisseur : ce qui protège l'argent, et comment le garder longtemps.",
    cover: `${V}/journal_macro.webp`,
    product: { slug: 'couronne-i', label: 'Découvrir Couronne I' },
    body: [
      {
        type: 'lead',
        text: "L'argent 925 noircit. C'est sa nature : au contact de l'air et de la peau, il s'oxyde. Le rhodium est notre réponse, un bain de quelques microns qui scelle la surface.",
      },
      {
        type: 'p',
        text: "Ce métal de la famille du platine est plus dur et plus blanc que l'argent. Il ne ternit pas et résiste aux rayures légères. Sur des lames polies miroir, il garde l'éclat intact des mois durant.",
      },
      { type: 'images', images: [`${V}/journal_alliance.webp`, `${IMG}/macro-griffe_nuit.webp`] },
      {
        type: 'p',
        text: "Pour qu'il dure : évitez le chlore des piscines et les parfums appliqués directement sur la pièce, rangez-la seule dans son écrin, et essuyez-la avec un chiffon doux. Si les frottements finissent par user le voile, nous pouvons le reposer à l'atelier.",
      },
      { type: 'quote', text: '« Le rhodium protège l’argent ; il ne craint que les frottements répétés. »' },
    ],
  },
  {
    slug: 'cire-perdue-argent-trouve',
    title: 'Cire perdue, argent trouvé',
    category: 'Atelier',
    minutes: 8,
    date: '2026-08-30',
    excerpt: "Résine, plâtre, 960 °C : les étapes d'une fonte à cire perdue, la technique qui donne naissance à chaque pièce.",
    cover: `${V}/journal_maillons.webp`,
    coverPosition: '50% 35%',
    product: { slug: 'couronne-i', label: 'Découvrir Couronne I' },
    body: [
      {
        type: 'lead',
        text: "La fonte à cire perdue a plus de cinq mille ans. Nous l'avons gardée presque intacte ; seule la cire a changé, remplacée par une résine imprimée couche par couche.",
      },
      {
        type: 'p',
        text: "Le modèle imprimé est fixé sur un arbre de coulée, puis noyé dans un plâtre réfractaire. Au four, la résine brûle et s'évapore : il ne reste qu'une empreinte creuse, fidèle au dixième de millimètre.",
      },
      { type: 'images', images: ['/img/vitrine/atelier_02-couler.webp', '/img/vitrine/atelier_03-polir.webp'] },
      {
        type: 'p',
        text: "L'argent est versé à 960 °C dans le moule encore chaud. Quelques secondes suffisent pour qu'il atteigne la pointe de chaque lame. Le plâtre est ensuite brisé à l'eau froide, et la pièce brute apparaît, grise et rugueuse.",
      },
      { type: 'quote', text: '« Il faut détruire le moule pour obtenir la pièce. »' },
      {
        type: 'p',
        text: "Viennent ensuite l'ébavurage, le polissage miroir, le bain de rhodium et, enfin, la gravure du numéro à l'intérieur de l'anneau.",
      },
    ],
  },
]

export const articleDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
