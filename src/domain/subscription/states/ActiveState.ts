import { SubscriptionState } from '../SubscriptionState'
import { InactiveState } from './InactiveState'

export class ActiveState implements SubscriptionState {
  canAccess(): boolean {
    return true
  }

  onPayment(): SubscriptionState {
    return this
  }

  deactivate(): SubscriptionState {
    return new InactiveState()
  }

  reactivate(): SubscriptionState {
    return this
  }
}
