export { CompletedState } from './CompletedState'
export { FailedState } from './FailedState'
export { PendingState } from './PendingState'
export { AwaitingPaymentState } from './AwaitingPaymentState'

import { TransactionState } from '../TransactionState'
import { CompletedState } from './CompletedState'
import { FailedState } from './FailedState'
import { PendingState } from './PendingState'
import { AwaitingPaymentState } from './AwaitingPaymentState'

export const createTransactionState = (status: string): TransactionState => {
  switch (status) {
    case 'completed':
      return new CompletedState()
    case 'failed':
      return new FailedState()
    case 'pending':
      return new PendingState()
    case 'awaiting_payment':
      return new AwaitingPaymentState()
    default:
      return new PendingState()
  }
}
