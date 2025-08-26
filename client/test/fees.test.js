import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { calculateTotal, calculateSubtotal } from '../src/lib/fees.ts'

const sampleRows = [
  { quantity: 1, type: 'adult', isRpnActive: true },
  { quantity: 2, type: 'minor', isRpnActive: false },
]

test('calculateSubtotal returns expected value', () => {
  const row = { quantity: 2, type: 'adult', isRpnActive: true }
  equal(calculateSubtotal(row), 140)
})

test('calculateTotal aggregates correctly', () => {
  equal(calculateTotal(sampleRows), 60 + 10 + 20)
})
