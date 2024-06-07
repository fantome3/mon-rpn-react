import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { DeathAnnouncement } from '@/types/DeathAnnouncement'

export const useNewDeathAnnouncementMutation = () =>
  useMutation({
    mutationFn: async (announcement: DeathAnnouncement) =>
      (
        await apiClient.post<DeathAnnouncement>(
          `api/announcements/new`,
          announcement
        )
      ).data,
  })

export const useGetAnnouncementsQuery = () =>
  useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await apiClient.get(`api/announcements/all`)).data,
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
