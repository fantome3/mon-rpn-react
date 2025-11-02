import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { ReservationPayload } from '@/pages/evenements/reservation'

export interface ReservationRecord extends ReservationPayload {
  _id: string
  status: 'pending' | 'confirmed' | 'refunded'
  createdAt: string
  updatedAt: string
  meta?: Record<string, unknown>
}

export const useNewReservationMutation = () =>
  useMutation({
    mutationFn: async (reservation: ReservationPayload) =>
      (
        await apiClient.post<ReservationRecord>(
          `api/reservations/new`,
          reservation
        )
      ).data,
  })

export const useGetReservationsQuery = () =>
  useQuery({
    queryKey: ['reservations'],
    queryFn: async () =>
      (await apiClient.get<ReservationRecord[]>(`api/reservations/all`)).data,
  })

export const useConfirmReservationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await apiClient.post<ReservationRecord>(`api/reservations/${id}/confirm`, {})).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export const useUpdateReservationAmountMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; totalAmount: number }) =>
      (
        await apiClient.patch<ReservationRecord>(
          `api/reservations/${params.id}/amount`,
          { totalAmount: params.totalAmount }
        )
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export const useRefundReservationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`api/reservations/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

