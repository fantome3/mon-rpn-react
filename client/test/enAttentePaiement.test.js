import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEnAttentePaiement } from '../src/lib/accountUtils.ts';

const account = {
  _id: '1',
  firstName: 'John',
  lastName: 'Doe',
  userTel: '123',
  userResidenceCountry: 'CA',
  solde: 0,
  paymentMethod: 'enAttentePaiement',
  enAttentePaiement: true,
  userId: '1',
};

test('returns true when account is pending and solde zero', () => {
  assert.strictEqual(isEnAttentePaiement(account), true);
});

test('returns false when solde is positive', () => {
  assert.strictEqual(isEnAttentePaiement({ ...account, solde: 10 }), false);
});
