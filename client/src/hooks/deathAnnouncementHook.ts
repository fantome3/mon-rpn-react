import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { CreateDeathAnnouncementInput, DeathAnnouncement } from '@/types'

export type CreateDeathAnnouncementResponse = {
  message: string
  announcement: DeathAnnouncement
}

export type CreateDeathAnnouncementBatchResponse = {
  message: string
  announcements: DeathAnnouncement[]
  queuedCount: number
  skippedCount: number
}

export const useNewDeathAnnouncementBatchMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (inputs: CreateDeathAnnouncementInput[]) =>
      (
        await apiClient.post<CreateDeathAnnouncementBatchResponse>(
          'api/announcements/batch',
          inputs
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export const useNewDeathAnnouncementMutation = () =>
  useMutation({
    mutationFn: async (announcement: DeathAnnouncement) =>
      (
        await apiClient.post<CreateDeathAnnouncementResponse>(
          `api/announcements/new`,
          announcement
        )
      ).data,
  })

export const useGetAnnouncementsQuery = (options?: {
  refetchInterval?: number | false
}) =>
  useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await apiClient.get(`api/announcements/all`)).data,
    refetchInterval: options?.refetchInterval,
  })

export const useUpdateAnnouncementMutation = () =>
  useMutation({
    mutationFn: async (announcement: DeathAnnouncement) =>
      (
        await apiClient.put<{
          announcement: DeathAnnouncement
          message: string
        }>(`api/announcements/${announcement._id}`, announcement)
      ).data,
  })

export const useGetSummaryQuery = () =>
  useQuery({
    queryKey: ['summary'],
    queryFn: async () =>
      (await apiClient.get(`api/announcements/summary`)).data,
  })
