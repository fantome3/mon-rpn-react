import { useQuery } from '@tanstack/react-query'
import apiClient from '@/apiClient'

export type StuckMember = {
  isPrimary: boolean
  memberId?: string
  memberIndex: number
  memberName: string
  rpnStatus: string
  rpnBalance?: number
}

export type RpnPendingUser = {
  userId: string
  fullName: string
  stuckMembers: StuckMember[]
}

export type RpnSyncPayload =
  | { memberType: 'primary' }
  | { memberType: 'family'; memberId?: string; memberIndex: number }

export type RpnSyncResult = {
  success: boolean
  matricule?: string
  reference?: string
  error?: string
}

export const useGetRpnPendingQuery = () =>
  useQuery({
    queryKey: ['rpn-pending'],
    queryFn: async () =>
      (await apiClient.get<{ users: RpnPendingUser[] }>('api/users/admin/rpn-pending')).data.users,
  })
