import { SubscriptionState } from '../SubscriptionState'
import { ActiveState } from './ActiveState'

export class ExpiredState implements SubscriptionState {
  canAccess(): boolean {
    return false
  }

  onPayment(): SubscriptionState {
    return new ActiveState()
  }

  deactivate(): SubscriptionState {
    return this
  }

  reactivate(): SubscriptionState {
    return new ActiveState()
  }
}
