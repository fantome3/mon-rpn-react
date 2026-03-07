import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { Transaction } from '@/types'

type TransactionMutationResponse = {
  transaction: Transaction
  message: string
}

export const useNewTransactionMutation = () =>
  useMutation({
    mutationFn: async (transaction: Transaction) =>
      (await apiClient.post<Transaction>(`api/transactions/new`, transaction))
        .data,
  })

export const useManualBalanceReminderMutation = () =>
  useMutation({
    mutationFn: async (userId: string) =>
      (
        await apiClient.post(
          `api/transactions/manual-balance-reminder/${userId}`
        )
      ).data,
  })

export const useManualUserPaymentMutation = () =>
  useMutation({
    mutationFn: async (userId: string) =>
      (await apiClient.post(`api/transactions/manual-payment/${userId}`)).data,
  })

export const useSendManualRemindersMutation = () =>
  useMutation({
    mutationFn: async () =>
      (await apiClient.post(`api/transactions/manual-reminders`)).data,
  })

export const useGetAllTransactionsQuery = () =>
  useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: async () =>
      (await apiClient.get<Transaction[]>(`api/transactions/all`)).data,
  })

export const useGetTransactionSummaryQuery = () =>
  useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: async () => (await apiClient.get(`api/transactions/summary`)).data,
  })

export const useGetTransactionsByUserIdQuery = (userId?: string) =>
  useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () =>
      (await apiClient.get<Transaction[]>(`api/transactions/${userId}/all`))
        .data,
    enabled: !!userId,
  })

export const useDeleteTransactionMutation = () =>
  useMutation({
    mutationFn: async (transactionId: string) =>
      (
        await apiClient.delete<{ message: string }>(
          `api/transactions/${transactionId}`
        )
      ).data,
  })

export const useUpdateTransactionMutation = () =>
  useMutation({
    mutationFn: async (transaction: Transaction) =>
      (
        await apiClient.put<{ transaction: Transaction; message: string }>(
          `api/transactions/${transaction._id}`,
          transaction
        )
      ).data,
  })

export const useConfirmTransactionMutation = () =>
  useMutation({
    mutationFn: async (transactionId: string) =>
      (
        await apiClient.post<TransactionMutationResponse>(
          `api/transactions/${transactionId}/confirm`
        )
      ).data,
  })

export const useRejectTransactionMutation = () =>
  useMutation({
    mutationFn: async (transactionId: string) =>
      (
        await apiClient.post<TransactionMutationResponse>(
          `api/transactions/${transactionId}/reject`
        )
      ).data,
  })

export const useFailTransactionMutation = () =>
  useMutation({
    mutationFn: async (transactionId: string) =>
      (
        await apiClient.post<TransactionMutationResponse>(
          `api/transactions/${transactionId}/fail`
        )
      ).data,
  })

export const useProcessTransactionMutation = () =>
  useMutation({
    mutationFn: async ({
      transactionId,
      outcome,
    }: {
      transactionId: string
      outcome: 'completed' | 'failed'
    }) =>
      (
        await apiClient.post<TransactionMutationResponse>(
          `api/transactions/${transactionId}/process`,
          { outcome }
        )
      ).data,
  })

export const useRefundTransactionMutation = () =>
  useMutation({
    mutationFn: async ({
      transactionId,
      amount,
    }: {
      transactionId: string
      amount?: number
    }) =>
      (
        await apiClient.post<TransactionMutationResponse>(
          `api/transactions/${transactionId}/refund`,
          amount === undefined ? {} : { amount }
        )
      ).data,
  })
