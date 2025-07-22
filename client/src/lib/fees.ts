export type FeeType = 'adult' | 'minor'

export type FeeDetail = {
  id: string
  feeDescription: string
  quantity: number
  type: FeeType
  isRpnActive: boolean
}

export const MONTANT_OBLIGATOIRE = {
  adult: 60,
  minor: 10,
} as const

export const MONTANT_MINIMUM_RPN = 10

export const calculateSubtotal = (
  row: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>,
): number =>
  row.quantity *
  (MONTANT_OBLIGATOIRE[row.type] + (row.isRpnActive ? MONTANT_MINIMUM_RPN : 0))

export const calculateTotal = (
  rows: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>[],
): number => rows.reduce((sum, r) => sum + calculateSubtotal(r), 0)
