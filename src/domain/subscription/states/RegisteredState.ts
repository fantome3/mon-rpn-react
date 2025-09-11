import { SubscriptionState } from '../SubscriptionState'
import { ActiveState } from './ActiveState'
import { InactiveState } from './InactiveState'

export class RegisteredState implements SubscriptionState {
  canAccess(): boolean {
    return true
  }

  onPayment(): SubscriptionState {
    return new ActiveState()
  }

  deactivate(): SubscriptionState {
    return new InactiveState()
  }

  reactivate(): SubscriptionState {
    return new ActiveState()
  }
}
