import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { User } from '@/types/User'

export const useLoginMutation = () =>
  useMutation({
    mutationFn: async ({
      email,
      password,
      rememberMe,
    }: {
      email: string
      password: string
      rememberMe: boolean
    }) =>
      (
        await apiClient.post<User>(`api/users/login`, {
          email,
          password,
          rememberMe,
        })
      ).data,
  })

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: async (user: User) =>
      (await apiClient.post<User>(`api/users/register`, user)).data,
  })

export const useGetUsersQuery = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: async () => (await apiClient.get<[User]>(`api/users/all`)).data,
  })

export const useDeleteUserMutation = () =>
  useMutation({
    mutationFn: async (userId: string) =>
      (await apiClient.delete<{ message: string }>(`api/users/${userId}`)).data,
  })

export const useUpdateUserMutation = () =>
  useMutation({
    mutationFn: async (user: User) =>
      (
        await apiClient.put<{ user: User; message: string }>(
          `api/users/${user._id}`,
          user
        )
      ).data,
  })

export const useGetUserDetailsQuery = (userId: string) =>
  useQuery({
    queryKey: ['user', userId],
    queryFn: async () =>
      (await apiClient.get<User>(`api/users/${userId}`)).data,
  })
