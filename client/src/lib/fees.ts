export type FeeType = 'worker' | 'student' | 'minor'

export type FeeDetail = {
  id: string
  feeDescription: string
  quantity: number
  type: FeeType
  isRpnActive: boolean
}

const BASE_FEES: Record<FeeType, number> = {
  worker: 65, // 50$ adhésion + 15$ traitement
  student: 40, // 25$ adhésion + 15$ traitement
  minor: 15, // 15$ traitement, pas d'adhésion
}

const RPN_FEES: Record<FeeType, number> = {
  worker: 20,
  student: 20,
  minor: 10,
}

export const calculateSubtotal = (
  row: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>,
): number =>
  row.quantity *
  (BASE_FEES[row.type] + (row.isRpnActive ? RPN_FEES[row.type] : 0))

export const calculateTotal = (
  rows: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>[],
): number => rows.reduce((sum, r) => sum + calculateSubtotal(r), 0)
