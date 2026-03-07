import test from 'node:test'
import assert from 'node:assert/strict'
import { TransactionDomainError } from '../src/services/transactionService'

test('TransactionDomainError expose le message et le status par defaut', () => {
  const error = new TransactionDomainError('Erreur metier')

  assert.equal(error.message, 'Erreur metier')
  assert.equal(error.statusCode, 400)
  assert.equal(error.name, 'TransactionDomainError')
})

test('TransactionDomainError accepte un status personnalise', () => {
  const error = new TransactionDomainError('Introuvable', 404)

  assert.equal(error.statusCode, 404)
  assert.equal(error.message, 'Introuvable')
})

