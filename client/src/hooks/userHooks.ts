import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { User } from '@/types/User'

export const useVerifyTokenMutation = () =>
  useMutation({
    mutationFn: async (token: string) =>
      (await apiClient.post(`api/users/verify-token`, { token })).data,
  })

export const useGenerateTokenMutation = () =>
  useMutation({
    mutationFn: async (email: string) =>
      (await apiClient.post(`api/users/generate-token`, { email })).data,
  })

export const useSendPasswordMutation = () =>
  useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) =>
      (await apiClient.post(`api/users/send-password`, { email, password }))
        .data,
  })

export const useNewUserNotificationMutation = () =>
  useMutation({
    mutationFn: async (email: string) =>
      (await apiClient.post(`api/users/new-user-notification`, { email })).data,
  })

export const useForgotPasswordMutation = () =>
  useMutation({
    mutationFn: async ({ email }: { email: string }) =>
      (await apiClient.post(`api/users/forgot-password`, { email })).data,
  })

export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: async ({
      password,
      userId,
      token,
    }: {
      password: string
      userId: string
      token: string
    }) =>
      await apiClient.post(`api/users/reset-password/${userId}/${token}`, {
        password,
      }),
  })

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

    onSuccess: (user) => {
      console.log('Login successful:', user)
    },
    onError: (error) => {
      console.error('Login failed:', error)
    },
  })

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: async (user: User) =>
      (await apiClient.post<User>(`api/users/register`, user)).data,
  })

export const useGetUserByReferralId = (referredBy?: string) =>
  useQuery({
    queryKey: ['users', referredBy],
    queryFn: async () =>
      (await apiClient.get(`api/users/${referredBy}/referral`)).data,
    enabled: !!referredBy,
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
