import { useState, useContext } from 'react'
import Loading from '@/components/Loading'
import MemberCoverageCard from '@/components/MemberCoverageCard'
import ProfilLayout from '@/components/ProfilLayout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
  useTogglePrimaryRpnMutation,
} from '@/hooks/userHooks'
import { usePartialBillingMembers } from '@/hooks/usePartialBillingMembers'
import { resolveFamilyMemberRpnStatus } from '@/lib/familyMemberRules'
import { Store } from '@/lib/Store'
import { toastAxiosError } from '@/lib/utils'
import type { RpnStatus } from '@/types/User'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

type ConfirmTarget =
  | { type: 'primary'; name: string }
  | { type: 'family'; realIndex: number; name: string }

const MaCouverture = () => {
  const { state } = useContext(Store)
  const { userInfo } = state

  const { data: user, isPending } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const partialBillingMembers = usePartialBillingMembers()
  const { mutateAsync: updateUser, isPending: isUpdatingFamily } = useUpdateUserMutation()
  const { mutateAsync: togglePrimaryRpn, isPending: isUpdatingPrimary } = useTogglePrimaryRpnMutation(userInfo?._id ?? '')
  const queryClient = useQueryClient()

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const isUpdating = isUpdatingFamily || isUpdatingPrimary

  const visibleMembers = (user?.familyMembers ?? [])
    .map((m, i) => ({ member: m, realIndex: i }))
    .filter(({ member }) => member.status !== 'deleted')

  const primaryName = `${user?.origines?.firstName ?? userInfo?.origines?.firstName ?? ''} ${user?.origines?.lastName ?? userInfo?.origines?.lastName ?? ''}`

  const executePrimaryToggle = async (currentStatus: RpnStatus) => {
    try {
      const action = currentStatus === 'enrolled' ? 'unsubscribe' : 'resubscribe'
      await togglePrimaryRpn(action)
      await queryClient.invalidateQueries({ queryKey: ['user', userInfo?._id ?? ''] })
    } catch (err) {
      toastAxiosError(err)
    }
  }

  const executeFamilyToggle = async (realIndex: number, currentStatus: RpnStatus) => {
    if (!user) return
    const newStatus: RpnStatus = currentStatus === 'enrolled' ? 'unsubscribed' : 'pending'
    const updatedMembers = (user.familyMembers ?? []).map((m, i) =>
      i === realIndex ? { ...m, rpnStatus: newStatus } : m
    )
    try {
      await updateUser({ ...user, familyMembers: updatedMembers })
      await queryClient.invalidateQueries({ queryKey: ['user', userInfo?._id ?? ''] })
    } catch (err) {
      toastAxiosError(err)
    }
  }

  const handleToggleRpn = (target: ConfirmTarget, currentStatus: RpnStatus) => {
    if (currentStatus === 'enrolled') {
      setConfirmTarget(target)
    } else {
      if (target.type === 'primary') {
        executePrimaryToggle(currentStatus)
      } else {
        executeFamilyToggle(target.realIndex, currentStatus)
      }
    }
  }

  const handleConfirmUnsubscribe = async () => {
    if (!confirmTarget) return
    if (confirmTarget.type === 'primary') {
      await executePrimaryToggle('enrolled')
    } else {
      await executeFamilyToggle(confirmTarget.realIndex, 'enrolled')
    }
    setConfirmTarget(null)
  }

  const primaryRpnStatus = user?.subscription?.rpnStatus ?? 'not_enrolled'
  const primaryCanToggle = primaryRpnStatus === 'enrolled' || primaryRpnStatus === 'unsubscribed'

  return (
    <ProfilLayout>
      {isPending ? (
        <Loading />
      ) : (
        <div className='space-y-4'>
          <MemberCoverageCard
            name={primaryName}
            membershipIncluded={user?.subscription?.status === 'active'}
            rpnStatus={primaryRpnStatus}
            rpnMatricule={user?.subscription?.rpnMatricule}
            isLoading={isUpdating}
            onToggleRpn={
              primaryCanToggle
                ? () => handleToggleRpn({ type: 'primary', name: primaryName }, primaryRpnStatus)
                : undefined
            }
          />

          {visibleMembers.map(({ member, realIndex }) => {
            const status: RpnStatus = resolveFamilyMemberRpnStatus(member)
            const canToggle = status === 'enrolled' || status === 'unsubscribed'
            const memberName = `${member.firstName} ${member.lastName}`
            return (
              <MemberCoverageCard
                key={realIndex}
                name={memberName}
                relationship={member.relationship}
                membershipIncluded={member.status === 'active'}
                membershipPending={
                  member.status === 'active' &&
                  member.membershipCoveredThisYear === null
                }
                rpnStatus={status}
                rpnMatricule={member.rpnMatricule}
                isLoading={isUpdating}
                onToggleRpn={
                  canToggle
                    ? () => handleToggleRpn({ type: 'family', realIndex, name: memberName }, status)
                    : undefined
                }
              />
            )
          })}

          <div className='flex flex-col gap-2 pt-2'>
            <Link to='/dependents' className='text-primary text-sm font-medium hover:underline'>
              Gérer les membres →
            </Link>
            {partialBillingMembers.length > 0 && (
              <Link to='/billing-partiel' className='text-primary text-sm font-medium hover:underline'>
                Régulariser la couverture ({partialBillingMembers.length} membre{partialBillingMembers.length > 1 ? 's' : ''} en attente) →
              </Link>
            )}
          </div>
        </div>
      )}

      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désinscrire du RPN ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.name
                ? `${confirmTarget.name} ne bénéficiera plus du fonds d'entraide en cas de décès.`
                : "Cette personne ne bénéficiera plus du fonds d'entraide en cas de décès."}{' '}
              Vous pourrez réinscrire à tout moment depuis cette page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700 text-white'
              disabled={isUpdating}
              onClick={handleConfirmUnsubscribe}
            >
              Désinscrire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfilLayout>
  )
}

export default MaCouverture
