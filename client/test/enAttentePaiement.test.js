import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAccountPendingPayment } from '../src/lib/accountValidation';

const account = {
  _id: '1',
  firstName: 'John',
  lastName: 'Doe',
  userTel: '123',
  userResidenceCountry: 'CA',
  solde: 0,
  paymentMethod: 'interact',
  isAwaitingFirstPayment: true,
  userId: '1',
};

test('returns true when account is pending and solde zero', () => {
  assert.strictEqual(isAccountPendingPayment(account), true);
});

test('returns false when solde is positive', () => {
  assert.strictEqual(isAccountPendingPayment({ ...account, solde: 10 }), false);
});
