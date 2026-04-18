import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TransactionDomainError,
  TransactionDomainService,
} from '../src/services/transactionService'
import {
  TransactionFundType,
  TransactionModel,
  TransactionStatus,
  TransactionType,
} from '../src/models/transactionModel'
import { AccountModel } from '../src/models/accountModel'

type RestoreFn = () => void

const patch = (
  target: Record<string, unknown>,
  key: string,
  replacement: unknown
): RestoreFn => {
  const original = target[key]
  target[key] = replacement
  return () => {
    target[key] = original
  }
}

const restoreAll = (restorers: RestoreFn[]) => {
  while (restorers.length > 0) {
    const restore = restorers.pop()
    if (restore) restore()
  }
}

test('TransactionDomainService', async (t) => {
  await t.test(
    'create met la transaction en awaiting_payment sans toucher au compte utilisateur',
    async () => {
      const service = new TransactionDomainService()
      const restorers: RestoreFn[] = []
      let accountFindOneCalled = false

      restorers.push(
        patch(
          TransactionModel.prototype as unknown as Record<string, unknown>,
          'save',
          async function savePatched(this: unknown) {
            return this
          }
        )
      )

      restorers.push(
        patch(
          AccountModel as unknown as Record<string, unknown>,
          'findOne',
          async () => {
            accountFindOneCalled = true
            return null
          }
        )
      )

      try {
        const transaction = await service.create({
          userId: 'user-1',
          amount: 0,
          type: TransactionType.CREDIT,
          reason: 'Inscription sans reference Interac',
        })

        assert.equal(transaction.status, TransactionStatus.AWAITING_PAYMENT)
        assert.equal(accountFindOneCalled, false)
      } finally {
        restoreAll(restorers)
      }
    }
  )

  await t.test(
    'initiateDeposit met a jour le compte utilisateur apres creation de transaction',
    async () => {
      const service = new TransactionDomainService()
      const restorers: RestoreFn[] = []

      const accountStub = {
        paymentMethod: 'credit_card',
        isAwaitingFirstPayment: false,
        isNew: false,
        isModified: () => true,
        save: async () => accountStub,
      }

      restorers.push(
        patch(
          TransactionModel.prototype as unknown as Record<string, unknown>,
          'save',
          async function savePatched(this: unknown) {
            return this
          }
        )
      )

      restorers.push(
        patch(
          AccountModel as unknown as Record<string, unknown>,
          'findOne',
          async () => accountStub
        )
      )

      try {
        const transaction = await service.initiateDeposit({
          userId: 'user-1',
          amount: 0,
          type: TransactionType.CREDIT,
          reason: 'Inscription sans reference Interac',
        })

        assert.equal(transaction.status, TransactionStatus.AWAITING_PAYMENT)
        assert.equal(accountStub.paymentMethod, 'interac')
        assert.equal(accountStub.isAwaitingFirstPayment, true)
      } finally {
        restoreAll(restorers)
      }
    }
  )

  await t.test('initiateDeposit refuse les transactions non credit', async () => {
    const service = new TransactionDomainService()

    await assert.rejects(
      () =>
        service.initiateDeposit({
          userId: 'user-1',
          amount: 10,
          type: TransactionType.DEBIT,
          reason: 'Operation non depôt',
        }),
      (error: unknown) => {
        assert.ok(error instanceof TransactionDomainError)
        assert.equal(error.statusCode, 400)
        return true
      }
    )
  })

  await t.test('confirm applique le credit et complete la transaction', async () => {
    const service = new TransactionDomainService()
    const restorers: RestoreFn[] = []

    const accountStub = {
      membership_balance: 0,
      rpn_balance: 100,
      paymentMethod: 'interac',
      isAwaitingFirstPayment: true,
      interac: [],
      save: async () => accountStub,
    }

    const transactionStub = {
      _id: 'tx-confirm',
      userId: 'user-1',
      amount: 50,
      type: TransactionType.CREDIT,
      fundType: TransactionFundType.RPN,
      membershipAmount: 0,
      rpnAmount: 50,
      reason: 'Renflouement RPN',
      refInterac: 'CABC123',
      status: TransactionStatus.PENDING,
      balanceApplied: false,
      save: async () => transactionStub,
    }

    restorers.push(
      patch(
        TransactionModel as unknown as Record<string, unknown>,
        'findById',
        async () => transactionStub
      )
    )
    restorers.push(
      patch(
        AccountModel as unknown as Record<string, unknown>,
        'findOne',
        async () => accountStub
      )
    )

    try {
      const result = await service.confirm('tx-confirm', 'admin-1')

      assert.equal(result.status, TransactionStatus.COMPLETED)
      assert.equal(result.balanceApplied, true)
      assert.equal(result.processedBy, 'admin-1')
      assert.equal(accountStub.rpn_balance, 150)
      assert.equal(accountStub.isAwaitingFirstPayment, false)
    } finally {
      restoreAll(restorers)
    }
  })

  await t.test('reject annule le credit applique et passe rejected', async () => {
    const service = new TransactionDomainService()
    const restorers: RestoreFn[] = []

    const accountStub = {
      membership_balance: 20,
      rpn_balance: 80,
      save: async () => accountStub,
    }

    const transactionStub = {
      _id: 'tx-reject',
      userId: 'user-2',
      amount: 30,
      type: TransactionType.CREDIT,
      fundType: TransactionFundType.RPN,
      membershipAmount: 0,
      rpnAmount: 30,
      reason: 'Paiement invalide',
      status: TransactionStatus.PENDING,
      balanceApplied: true,
      save: async () => transactionStub,
    }

    restorers.push(
      patch(
        TransactionModel as unknown as Record<string, unknown>,
        'findById',
        async () => transactionStub
      )
    )
    restorers.push(
      patch(
        AccountModel as unknown as Record<string, unknown>,
        'findOne',
        async () => accountStub
      )
    )

    try {
      const result = await service.reject('tx-reject', 'admin-2')

      assert.equal(result.status, TransactionStatus.REJECTED)
      assert.equal(result.balanceApplied, false)
      assert.equal(accountStub.rpn_balance, 50)
    } finally {
      restoreAll(restorers)
    }
  })

  await t.test('refund partiel decremente le fonds RPN et passe refunded', async () => {
    const service = new TransactionDomainService()
    const restorers: RestoreFn[] = []

    const accountStub = {
      membership_balance: 40,
      rpn_balance: 200,
      save: async () => accountStub,
    }

    const transactionStub = {
      _id: 'tx-refund',
      userId: 'user-3',
      amount: 100,
      type: TransactionType.CREDIT,
      fundType: TransactionFundType.RPN,
      membershipAmount: 0,
      rpnAmount: 100,
      reason: 'Renflouement RPN',
      status: TransactionStatus.COMPLETED,
      refundedAmount: 10,
      save: async () => transactionStub,
    }

    restorers.push(
      patch(
        TransactionModel as unknown as Record<string, unknown>,
        'findById',
        async () => transactionStub
      )
    )
    restorers.push(
      patch(
        AccountModel as unknown as Record<string, unknown>,
        'findOne',
        async () => accountStub
      )
    )

    try {
      const result = await service.refund('tx-refund', 40, 'admin-3')

      assert.equal(result.status, TransactionStatus.REFUNDED)
      assert.equal(result.refundedAmount, 50)
      assert.equal(result.processedBy, 'admin-3')
      assert.equal(accountStub.rpn_balance, 160)
    } finally {
      restoreAll(restorers)
    }
  })

  await t.test('process refuse un outcome invalide', async () => {
    const service = new TransactionDomainService()

    await assert.rejects(
      () => service.process('tx-any', 'invalid' as never),
      (error: unknown) => {
        assert.ok(error instanceof TransactionDomainError)
        assert.equal(error.statusCode, 400)
        return true
      }
    )
  })
})

