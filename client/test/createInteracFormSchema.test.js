import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createInteracFormSchema } from '../src/lib/createInteracFormSchema.ts'

test('amount must be greater than min value', () => {
  const schema = createInteracFormSchema(100)
  const result = schema.safeParse({ amountInterac: 50, refInterac: 'ABCDEFGH' })
  assert.ok(!result.success)
})

test('accepts amount equal to min', () => {
  const schema = createInteracFormSchema(100)
  const result = schema.safeParse({ amountInterac: 100, refInterac: 'ABCDEFGH' })
  assert.ok(result.success)
})
