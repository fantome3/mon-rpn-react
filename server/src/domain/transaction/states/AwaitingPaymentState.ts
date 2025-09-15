import { TransactionState } from '../TransactionState'

export class AwaitingPaymentState implements TransactionState {
  status = 'awaiting_payment'
  getLabel(): string {
    return 'En attente paiement'
  }
  applyStyle(): string {
    return 'bg-blue-500 text-white text-xs'
  }
}
