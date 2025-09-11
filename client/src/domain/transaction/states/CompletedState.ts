import { TransactionState } from '../TransactionState'

export class CompletedState implements TransactionState {
  status = 'completed'
  getLabel(): string {
    return 'Réussie'
  }
  applyStyle(): string {
    return 'bg-green-500 text-white text-xs'
  }
}
