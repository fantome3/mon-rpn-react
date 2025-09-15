import { TransactionState } from '../TransactionState'

export class FailedState implements TransactionState {
  status = 'failed'
  getLabel(): string {
    return 'Echouée'
  }
  applyStyle(): string {
    return 'bg-red-500 text-white text-xs'
  }
}
