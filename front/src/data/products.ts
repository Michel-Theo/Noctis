export type Product = {
  slug: string
  name: string
  /** Prix en centimes ; null = pièce « en forge » (pas encore en vente). */
  price: number | null
  sub: string
  /** Famille de pièce : filtre de la page Collection. */
  type: 'bague' | 'chaine' | 'boucle'
  /** Visuel de carte (packshot Blender). Absent = carte floutée « en forge ». */
  card?: string
}

export type ProductDetail = Product & {
  serial: string
  pitch: string
  finishes: string[]
  sizes: number[]
  defaultSize: number
  gallery: { id: string; label: string; src?: string }[]
  specs: [string, string][]
  accordions: { title: string; body: string }[]
  worn: { big: string; top: string; bottom: string }
  related: string[]
}

const IMG = '/img/produit'

/** Ordre « Nouveautés » de la collection Nocturne. Seule Couronne I a son modèle 3D : les autres sont en forge. */
export const PRODUCTS: Product[] = [
  { slug: 'couronne-i', name: 'Couronne I', price: 14000, sub: 'Argent 925 rhodié · N° 001', type: 'bague', card: `${IMG}/34_nuit.webp` },
  { slug: 'spina', name: 'Spina', price: null, sub: 'Bague · bientôt', type: 'bague' },
  { slug: 'vigile', name: 'Vigile', price: null, sub: 'Bague · bientôt', type: 'bague' },
  { slug: 'couronne-ii', name: 'Couronne II', price: null, sub: 'Bague · bientôt', type: 'bague' },
  { slug: 'chaine-veille', name: 'Chaîne Veille', price: null, sub: 'Chaîne · bientôt', type: 'chaine' },
  { slug: 'epine', name: 'Épine', price: null, sub: 'Boucle unique · bientôt', type: 'boucle' },
  { slug: 'sceau', name: 'Sceau', price: null, sub: 'Chevalière · bientôt', type: 'bague' },
]

export const DETAILS: Record<string, ProductDetail> = {
  'couronne-i': {
    ...PRODUCTS[0],
    serial: 'N° 001 / 150',
    pitch:
      "Quatre griffes en crochet referment l'anneau autour d'un poignard central. Une pièce sculpturale, pensée comme une relique à porter chaque nuit.",
    finishes: ['Argent rhodié', 'Argent oxydé'],
    sizes: [52, 54, 56, 57, 58, 60, 62, 64],
    defaultSize: 57,
    gallery: [
      { id: '3d', label: 'Bague en 3D' },
      { id: 'face', label: 'Face', src: `${IMG}/face_nuit.webp` },
      { id: 'portee', label: 'Portée', src: `${IMG}/porte_dorsale_nuit.webp` },
      { id: 'profil', label: 'Profil', src: `${IMG}/profil_nuit.webp` },
      { id: 'macro', label: 'Macro', src: `${IMG}/macro-griffe_nuit.webp` },
    ],
    specs: [
      ['Poids', '≈ 9,4 g'],
      ['Largeur de face', '22 mm'],
      ['Hauteur de bande', '11 mm'],
      ['Ø intérieur', '18 mm (taille 57)'],
      ['Matière', 'Argent 925, rhodié'],
      ['Fabrication', 'Impression 3D, fonte à cire perdue'],
    ],
    accordions: [
      {
        title: 'Description',
        body: 'Vingt-six lames sculptées une à une, assemblées autour d’un poignard central. La bague tient debout seule, posée sur sa tranche.',
      },
      {
        title: 'Matière & entretien',
        body: 'Argent 925 massif, scellé au rhodium. Évitez le chlore et les parfums ; un chiffon doux suffit à lui rendre son éclat.',
      },
      { title: 'Dimensions', body: 'Largeur de face 22 mm, hauteur de bande 11 mm, poids ≈ 9,4 g en taille 57.' },
      {
        title: 'Livraison & retours',
        body: 'Coulée à la commande, expédiée sous 10 jours. Livraison offerte dès 150 €. Retours sous 30 jours, pièce non portée.',
      },
    ],
    worn: { big: `${IMG}/porte_dorsale_nuit.webp`, top: `${IMG}/porte_macro_nuit.webp`, bottom: `${IMG}/macro-poignard_nuit.webp` },
    related: ['couronne-ii', 'spina', 'vigile', 'chaine-veille'],
  },
}

export const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
