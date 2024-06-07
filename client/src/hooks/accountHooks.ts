import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { Account } from '@/types/Account'

export const useNewAccountMutation = () =>
  useMutation({
    mutationFn: async (account: Account) =>
      (await apiClient.post<Account>(`api/accounts/new`, account)).data,
  })

export const useGetAccountsByUserIdQuery = (userId?: string) =>
  useQuery({
    queryKey: ['accountsByUserId', userId],
    queryFn: async () =>
      (await apiClient.get(`api/accounts/${userId}/all`)).data,
  })

export const useGetAccountsQuery = () =>
  useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await apiClient.get(`api/accounts/all`)).data,
  })

export const useUpdateAccountMutation = () =>
  useMutation({
    mutationFn: async (account: Account) =>
      (
        await apiClient.put<{ account: Account; message: string }>(
          `api/accounts/${account._id}`,
          account
        )
      ).data,
  })

export const useGetAccountDetailsQuery = (accountId?: string) =>
  useQuery({
    queryKey: ['account', accountId],
    queryFn: async () =>
      (await apiClient.get<Account>(`api/accounts/${accountId}`)).data,
  })
