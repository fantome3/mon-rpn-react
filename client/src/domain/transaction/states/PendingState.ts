import { TransactionState } from '../TransactionState'

export class PendingState implements TransactionState {
  status = 'pending'
  getLabel(): string {
    return 'En approbation'
  }
  applyStyle(): string {
    return 'bg-yellow-500 text-white text-xs'
  }
}
