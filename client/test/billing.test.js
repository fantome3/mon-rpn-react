import { test, equal } from 'node:test'
import {
  buildTopUpReason,
  canPrimaryMemberTopUpRpn,
  computeTopUpAllocation,
  getLatestMembershipTopUpTransaction,
  getTargetFromQuery,
  isRpnTopUpTarget,
} from '../src/lib/billing.ts'

test('getTargetFromQuery accepts membership, rpn and both', () => {
  equal(getTargetFromQuery('membership'), 'membership')
  equal(getTargetFromQuery('rpn'), 'rpn')
  equal(getTargetFromQuery('both'), 'both')
  equal(getTargetFromQuery('invalid'), null)
})

test('buildTopUpReason returns reason for all targets', () => {
  equal(buildTopUpReason('membership'), 'Renflouement membership via Interac')
  equal(buildTopUpReason('rpn'), 'Renflouement fonds RPN via Interac')
  equal(
    buildTopUpReason('both'),
    'Paiement combine membership et fonds RPN via Interac',
  )
})

test('computeTopUpAllocation splits amount for combined payment and sends extra to rpn', () => {
  const allocation = computeTopUpAllocation({
    target: 'both',
    amountInterac: 190,
    membershipDueAmount: 150,
    rpnDueAmount: 20,
  })

  equal(allocation.membershipAmount, 150)
  equal(allocation.rpnAmount, 40)
})

test('computeTopUpAllocation keeps single-target flows unchanged', () => {
  const membershipAllocation = computeTopUpAllocation({
    target: 'membership',
    amountInterac: 60,
    membershipDueAmount: 50,
    rpnDueAmount: 20,
  })
  const rpnAllocation = computeTopUpAllocation({
    target: 'rpn',
    amountInterac: 35,
    membershipDueAmount: 50,
    rpnDueAmount: 20,
  })

  equal(membershipAllocation.membershipAmount, 60)
  equal(membershipAllocation.rpnAmount, 0)
  equal(rpnAllocation.membershipAmount, 0)
  equal(rpnAllocation.rpnAmount, 35)
})

test('combined payment reason is detected as membership top up', () => {
  const latest = getLatestMembershipTopUpTransaction([
    {
      amount: 170,
      type: 'credit',
      reason: 'Paiement combine membership et fonds RPN via Interac',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ])

  equal(latest?.reason, 'Paiement combine membership et fonds RPN via Interac')
})

test('isRpnTopUpTarget only matches rpn', () => {
  equal(isRpnTopUpTarget('rpn'), true)
  equal(isRpnTopUpTarget('membership'), false)
  equal(isRpnTopUpTarget('both'), false)
})

test('primary member cannot top up rpn when membership is not up to date', () => {
  const canTopUp = canPrimaryMemberTopUpRpn({
    isPrimaryMember: true,
    subscription: {
      status: 'active',
      membershipPaidThisYear: false,
      lastMembershipPaymentYear: new Date().getFullYear(),
    },
    transactions: [],
  })

  equal(canTopUp, false)
})

test('non-primary member is not blocked by membership gate for rpn top up', () => {
  const canTopUp = canPrimaryMemberTopUpRpn({
    isPrimaryMember: false,
    subscription: {
      status: 'registered',
      membershipPaidThisYear: false,
      lastMembershipPaymentYear: new Date().getFullYear(),
    },
    transactions: [],
  })

  equal(canTopUp, true)
})
