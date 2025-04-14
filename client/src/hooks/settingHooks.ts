import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '@/apiClient'
import { SettingType } from '@/types/Setting'

export const useGetSettingsQuery = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () =>
      (await apiClient.get<SettingType>(`api/settings/current`)).data,
  })

export const useUpdateSettingMutation = () =>
  useMutation({
    mutationFn: async (setting: SettingType) =>
      await apiClient.put<{ settings: SettingType; message: string }>(
        `api/settings/${setting._id}`,
        setting
      ),
  })
