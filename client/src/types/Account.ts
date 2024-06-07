type Card = {
  network: string
  cvv: string
  expiry_date: string
  card_holder_name?: string
  credit_card_number: string
}

export type Account = {
  _id?: string
  firstName: string
  userTel: string
  userResidenceCountry: string
  solde: number
  paymentMethod: 'credit_card' | 'money_transfert' | string
  card?: Card
  userId: string
}
