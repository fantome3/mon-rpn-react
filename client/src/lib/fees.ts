export type FeeType = 'worker' | 'student' | 'minor'

export type FeeDetail = {
  id: string
  feeDescription: string
  quantity: number
  type: FeeType
  isMembershipActive: boolean
  isAdhesionActive: boolean
  isRpnActive: boolean
}

const MEMBERSHIP_FEES: Record<FeeType, number> = {
  worker: 50,
  student: 25,
  minor: 0,
}

const ADHESION_FEES: Record<FeeType, number> = {
  worker: 10,
  student: 10,
  minor: 10,
}

const RPN_FEES: Record<FeeType, number> = {
  worker: 20,
  student: 20,
  minor: 20,
}

export const calculateSubtotal = (
  row: Pick<
    FeeDetail,
    'quantity' | 'type' | 'isMembershipActive' | 'isAdhesionActive' | 'isRpnActive'
  >,
): number =>
  row.quantity *
  ((row.isMembershipActive ? MEMBERSHIP_FEES[row.type] : 0) +
    (row.isAdhesionActive ? ADHESION_FEES[row.type] : 0) +
    (row.isRpnActive ? RPN_FEES[row.type] : 0))

export const calculateTotal = (
  rows: Pick<
    FeeDetail,
    'quantity' | 'type' | 'isMembershipActive' | 'isAdhesionActive' | 'isRpnActive'
  >[],
): number => rows.reduce((sum, r) => sum + calculateSubtotal(r), 0)
