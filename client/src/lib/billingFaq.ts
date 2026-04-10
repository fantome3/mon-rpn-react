export type BillingFaqImage = {
  src: string
  alt: string
  caption?: string
}

export type BillingFaqItem = {
  id: string
  question: string
  answer: string[]
  steps?: string[]
  tags?: string[]
  image?: BillingFaqImage
}

export const BILLING_FAQ_ITEMS: BillingFaqItem[] = [
  {
    id: 'paiement-application',
    question: "Je n'arrive pas à payer sur l'application.",
    answer: [
      "Le paiement ne se fait pas dans l'application. Vous payez via votre banque, via un virement Interac à l'adresse courriel fournit.",
      "Après le virement, revenez dans l'onglet Paiement pour saisir le montant et la référence Interac. La transaction sera ensuite vérifiée.",
    ],
    steps: [
      "Ouvrez votre application bancaire et lancez un virement Interac.",
      "Envoyez le virement à l'adresse indiquée dans l'onglet Paiement.",
      "Saisissez le montant et la référence Interac dans l'application.",
      'Validez la transaction pour démarrer la vérification.',
    ],
    tags: ['Paiement', 'Interac'],
  },
  {
    id: 'reference-interac',
    question: 'Où trouver le numéro de référence Interac ?',
    answer: [
      'Après le virement, votre banque envoie un courriel de confirmation. Un numéro de référence Interac commencant par C y apparaît.',
      'Copiez cette référence exactement et collez-la dans le champ prévu.',
    ],
    steps: [
      'Vérifiez vos courriels (y compris les courriers indésirables).',
      'Repérez le courriel de confirmation de virement Interac.',
      "Saisissez le numéro de référence telle qu'il apparaît.",
    ],
    tags: ['Référence', 'Interac'],
  },
  {
    id: 'montant-a-saisir',
    question: 'Quel montant dois-je entrer ?',
    answer: [
      'Le montant minimal est affiché selon votre situation familiale.',
      'Si vous payez Membership + Fonds RPN, tout surplus est ajouté automatiquement au fonds RPN.',
    ],
    tags: ['Montant', 'Membership', 'RPN'],
  },
  {
    id: 'rpn-bloque',
    question: 'Pourquoi le paiement RPN est-il bloqué ?',
    answer: [
      'Le paiement du fonds RPN seul est disponible uniquement quand la cotisation membership du membre principal et des personnes à charge est à jour.',
      'Si besoin, commencez par régler le Membership puis revenez pour le fonds RPN.',
    ],
    tags: ['RPN', 'Membership'],
  },
  {
    id: 'statut-verification',
    question: "J'ai payé, mais le statut est encore en vérification.",
    answer: [
      "Les paiements Interac sont vérifiés manuellement. Un délai est normal après l'envoi.",
      'Assurez-vous que la référence Interac et le montant saisis correspondent à votre virement.',
    ],
    tags: ['Statut', 'Vérification'],
  },
]
