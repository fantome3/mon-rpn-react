export type CardType = {
  network: string
  cvv: string
  expiry_date: string
  card_holder_name?: string
  credit_card_number: string
}

export type Interac = {
  amountInterac: number
  refInterac: string
}

export type Account = {
  _id?: string
  firstName: string
  lastName: string
  userTel: string
  userResidenceCountry: string
  solde: number
  paymentMethod: 'credit_card' | 'interac' | string
  card?: CardType[]
  interac?: Interac[]
  userId: string | any
  isAwaitingFirstPayment?: boolean
}
