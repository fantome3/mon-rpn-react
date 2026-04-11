import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { DeathAnnouncement } from '@/types'

export type CreateDeathAnnouncementResponse = {
  message: string
  announcement: DeathAnnouncement
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
