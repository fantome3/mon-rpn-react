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

export type MembershipFeeOverrides = {
  workerAmount?: number
  studentAmount?: number
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

export const resolveMembershipFees = (
  overrides?: MembershipFeeOverrides,
): Record<FeeType, number> => ({
  ...MEMBERSHIP_FEES,
  ...(overrides?.workerAmount !== undefined && { worker: overrides.workerAmount }),
  ...(overrides?.studentAmount !== undefined && { student: overrides.studentAmount }),
})

export const calculateSubtotal = (
  row: Pick<
    FeeDetail,
    'quantity' | 'type' | 'isMembershipActive' | 'isAdhesionActive' | 'isRpnActive'
  >,
  overrides?: MembershipFeeOverrides,
): number => {
  const fees = resolveMembershipFees(overrides)
  return (
    row.quantity *
    ((row.isMembershipActive ? fees[row.type] : 0) +
      (row.isAdhesionActive ? ADHESION_FEES[row.type] : 0) +
      (row.isRpnActive ? RPN_FEES[row.type] : 0))
  )
}

export const calculateTotal = (
  rows: Pick<
    FeeDetail,
    'quantity' | 'type' | 'isMembershipActive' | 'isAdhesionActive' | 'isRpnActive'
  >[],
  overrides?: MembershipFeeOverrides,
): number => rows.reduce((sum, r) => sum + calculateSubtotal(r, overrides), 0)

export const calculateMembershipTotal = (
  rows: Pick<
    FeeDetail,
    'quantity' | 'type' | 'isMembershipActive' | 'isAdhesionActive'
  >[],
  overrides?: MembershipFeeOverrides,
): number => {
  const fees = resolveMembershipFees(overrides)
  return rows.reduce(
    (sum, row) =>
      sum +
      row.quantity *
        ((row.isMembershipActive ? fees[row.type] : 0) +
          (row.isAdhesionActive ? ADHESION_FEES[row.type] : 0)),
    0,
  )
}

export const calculateMembershipOnlyTotal = (
  rows: Pick<FeeDetail, 'quantity' | 'type' | 'isMembershipActive'>[],
  overrides?: MembershipFeeOverrides,
): number => {
  const fees = resolveMembershipFees(overrides)
  return rows.reduce(
    (sum, row) =>
      sum + row.quantity * (row.isMembershipActive ? fees[row.type] : 0),
    0,
  )
}

export const calculateRpnTotal = (
  rows: Pick<FeeDetail, 'quantity' | 'type' | 'isRpnActive'>[],
): number =>
  rows.reduce(
    (sum, row) =>
      sum + row.quantity * (row.isRpnActive ? RPN_FEES[row.type] : 0),
    0,
  )
