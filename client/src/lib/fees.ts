export type FeeType = 'worker' | 'student' | 'minor'

export type FeeDetail = {
  id: string
  feeDescription: string
  quantity: number
  type: FeeType
  isRpnActive: boolean
}

const BASE_FEES: Record<FeeType, number> = {
  worker: 60, // 50 $ membership + 10 $ adhésion
  student: 35, // 25 $ membership + 10 $ adhésion
  minor: 10, // 10 $ adhésion
}

const RPN_FEES: Record<FeeType, number> = {
  worker: 20,
  student: 20,
  minor: 20,
}

export const calculateSubtotal = (
  row: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>,
): number =>
  row.quantity *
  (BASE_FEES[row.type] + (row.isRpnActive ? RPN_FEES[row.type] : 0))

export const calculateTotal = (
  rows: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>[],
): number => rows.reduce((sum, r) => sum + calculateSubtotal(r), 0)
