export interface TransactionState {
  status: string
  getLabel(): string
  applyStyle(): string
}
