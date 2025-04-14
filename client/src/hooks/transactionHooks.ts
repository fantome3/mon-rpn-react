import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { Transaction } from '@/types/Transaction'

export const useSendManualRemindersMutation = () =>
  useMutation({
    mutationFn: async () =>
      (await apiClient.post(`api/transactions/manual-reminders`)).data,
  })

export const useGetAllTransactionsQuery = () =>
  useQuery({
    queryKey: ['transactions'],
    queryFn: async () =>
      (await apiClient.get<Transaction[]>(`api/transactions/all`)).data,
  })

export const useGetTransactionSummaryQuery = () =>
  useQuery({
    queryKey: ['transactions'],
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
