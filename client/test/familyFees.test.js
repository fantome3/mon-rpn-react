import { test, equal } from 'node:test'
import {
  buildPaymentMessage,
  computeFamilyFeesSummary,
} from '../src/lib/familyFees.ts'

test('computeFamilyFeesSummary calculates membership and rpn from family composition', () => {
  const summary = computeFamilyFeesSummary({
    register: { occupation: 'worker' },
    familyMembers: [
      {
        relationship: 'Conjoint(e)',
        status: 'active',
        residenceCountryStatus: 'worker',
        birthDate: '1990-01-01',
      },
      {
        relationship: 'Enfant',
        status: 'active',
        residenceCountryStatus: 'student',
        birthDate: '2015-01-01',
      },
    ],
  })

  equal(summary.membershipAmount, 100)
  equal(summary.rpnAmount, 60)
  equal(summary.dependantCount, 2)
})

test('buildPaymentMessage returns solo variant when member is alone', () => {
  equal(buildPaymentMessage(80, 0), 'Montant a payer : 80$')
})

test('active child is treated as adult when age is 18+', () => {
  const summary = computeFamilyFeesSummary({
    register: { occupation: 'worker' },
    familyMembers: [
      {
        relationship: 'Enfant',
        status: 'active',
        residenceCountryStatus: 'canadian_citizen',
        birthDate: '1990-01-01',
      },
      {
        relationship: 'Conjoint(e)',
        status: 'inactive',
        residenceCountryStatus: 'canadian_citizen',
      },
      {
        relationship: 'Pere',
        status: 'inactive',
        residenceCountryStatus: 'visitor',
      },
      {
        relationship: 'Mere',
        status: 'inactive',
        residenceCountryStatus: 'visitor',
      },
    ],
  })

  equal(summary.membershipAmount, 100)
  equal(summary.dependantCount, 1)
})
