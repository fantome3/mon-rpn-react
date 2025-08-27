import { test, equal } from 'node:test'
import { getAccountDisplayStatus } from '../src/lib/accountUtils.ts'

test('detects awaiting first payment', () => {
  const { awaitingPayment, lastTransactionPending } = getAccountDisplayStatus(
    { isAwaitingFirstPayment: true },
    { status: 'awaiting_payment' }
  )
  equal(awaitingPayment, true)
  equal(lastTransactionPending, false)
})

test('detects pending transaction', () => {
  const { awaitingPayment, lastTransactionPending } = getAccountDisplayStatus(
    { isAwaitingFirstPayment: false },
    { status: 'pending' }
  )
  equal(awaitingPayment, false)
  equal(lastTransactionPending, true)
})

