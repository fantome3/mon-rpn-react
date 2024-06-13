type Card = {
  network: string
  cvv: string
  expiry_date: string
  card_holder_name?: string
  credit_card_number: string
}

type Interac = {
  emailInterac: string
  passwordInterac: string
}

export type Account = {
  _id?: string
  firstName: string
  userTel: string
  userResidenceCountry: string
  solde: number
  paymentMethod: 'credit_card' | 'interac' | string
  card?: Card
  interac?: Interac
  userId: string
}
