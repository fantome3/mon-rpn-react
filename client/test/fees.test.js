import { test, equal } from 'node:test'
import { calculateTotal, calculateSubtotal } from '../src/lib/fees.ts'

const sampleRows = [
  { quantity: 1, type: 'worker', isRpnActive: true },
  { quantity: 2, type: 'minor', isRpnActive: false },
]

test('calculateSubtotal returns expected value', () => {
  const row = { quantity: 2, type: 'worker', isRpnActive: true }
  equal(calculateSubtotal(row), 170)
})

test('calculateTotal aggregates correctly', () => {
  equal(calculateTotal(sampleRows), 85 + 30)
})
