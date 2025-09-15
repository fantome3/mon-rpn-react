export interface SubscriptionState {
  /**
   * Determines if the subscription state allows user access.
   */
  canAccess(): boolean

  /**
   * Handles a successful payment and returns the next state.
   */
  onPayment(): SubscriptionState

  /**
   * Transition to an inactive state.
   */
  deactivate(): SubscriptionState

  /**
   * Reactivate the subscription.
   */
  reactivate(): SubscriptionState
}
