/** Pages d'informations (maquette « Mentions légales & CGV »). NOCTIS est un projet fictif de portfolio. */

export type LegalPage = { slug: string; nav: string; title: string; updated: string; sections: { title: string; text: string }[] }

const UPDATED = '2026-10-25'

export const LEGAL: LegalPage[] = [
  {
    slug: 'mentions-legales',
    nav: 'Mentions légales',
    title: 'Mentions légales',
    updated: UPDATED,
    sections: [
      {
        title: 'Éditeur',
        text: "Ce site est un projet personnel réalisé par Théo Michel dans le cadre de son portfolio (BUT MMI). NOCTIS est une marque fictive : aucune société n'exploite ce site et aucun produit n'est réellement vendu.",
      },
      { title: 'Hébergement', text: 'Le site est hébergé sur un serveur privé virtuel loué par l’éditeur.' },
      {
        title: 'Propriété intellectuelle',
        text: 'Le logo, les textes, les modèles 3D et les rendus des pièces ont été créés pour ce projet. Les photographies d’ambiance sont publiées sous licence Unsplash : Tahlia Doyle, Enlightening Images, Lisette Harzing et Siora Photography.',
      },
    ],
  },
  {
    slug: 'cgv',
    nav: 'Conditions générales de vente',
    title: 'Conditions générales de vente',
    updated: UPDATED,
    sections: [
      {
        title: '1. Objet',
        text: "Les présentes conditions régissent les ventes de bijoux NOCTIS. NOCTIS est un projet fictif réalisé dans le cadre d'un portfolio : aucune vente réelle n'est effectuée.",
      },
      {
        title: '2. Commandes',
        text: 'Chaque pièce est fabriquée à la commande. La commande est ferme après confirmation du paiement ; un délai de fabrication de dix jours ouvrés s’applique.',
      },
      {
        title: '3. Prix',
        text: 'Les prix sont indiqués en euros, toutes taxes comprises. La livraison est offerte à partir de 150 € d’achat.',
      },
      {
        title: '4. Rétractation',
        text: 'Vous disposez de 30 jours à compter de la réception pour retourner une pièce non portée, dans son écrin d’origine.',
      },
    ],
  },
  {
    slug: 'livraison',
    nav: 'Livraison',
    title: 'Livraison',
    updated: UPDATED,
    sections: [
      { title: 'Fabrication', text: 'Chaque pièce est coulée à la commande : comptez dix jours ouvrés avant l’expédition.' },
      {
        title: 'Modes et tarifs',
        text: 'Colissimo suivi : 6,90 €, offert dès 150 € d’achat. Chronopost 24 h : 12 €. Retrait à l’atelier de Troyes : gratuit, sur rendez-vous.',
      },
      { title: 'Suivi', text: 'Un e-mail vous est envoyé à chaque étape : coulée, polissage, expédition. Le suivi est aussi visible dans votre compte.' },
    ],
  },
  {
    slug: 'retours',
    nav: 'Retours & garantie',
    title: 'Retours & garantie',
    updated: UPDATED,
    sections: [
      { title: 'Retours', text: 'Une pièce non portée peut être retournée sous 30 jours, dans son écrin d’origine. Le remboursement intervient à réception.' },
      {
        title: 'Garantie',
        text: 'Le rhodiage est garanti deux ans. Au-delà, nous pouvons reposer le voile de rhodium à l’atelier, sur devis.',
      },
    ],
  },
  {
    slug: 'donnees-personnelles',
    nav: 'Données personnelles',
    title: 'Données personnelles',
    updated: UPDATED,
    sections: [
      {
        title: 'Données collectées',
        text: 'Nom, e-mail et adresse de livraison, uniquement pour traiter une commande ou répondre à un message. Aucune donnée n’est revendue ni partagée.',
      },
      {
        title: 'Vos droits',
        text: 'Vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à l’atelier depuis la page Contact.',
      },
    ],
  },
  {
    slug: 'cookies',
    nav: 'Cookies',
    title: 'Cookies',
    updated: UPDATED,
    sections: [
      {
        title: 'Cookies utilisés',
        text: 'Un seul cookie technique : celui de votre session, quand vous êtes connecté à votre compte. Il ne sert à rien d’autre et disparaît à la déconnexion.',
      },
      {
        title: 'Stockage local',
        text: 'Votre panier et le thème choisi sont gardés dans votre navigateur. Aucun outil de mesure d’audience ni de publicité n’est utilisé.',
      },
    ],
  },
]
