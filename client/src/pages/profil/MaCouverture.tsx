import Loading from '@/components/Loading'
import MemberCoverageCard from '@/components/MemberCoverageCard'
import ProfilLayout from '@/components/ProfilLayout'
import { toast } from '@/components/ui/use-toast'
import { useGetUserDetailsQuery, useUpdateUserMutation } from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import { toastAxiosError } from '@/lib/utils'
import { FamilyMember } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'
import { Link } from 'react-router-dom'

const MaCouverture = () => {
  const { state, dispatch } = useContext(Store)
  const { userInfo } = state
  const queryClient = useQueryClient()

  const { data: user, isPending } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const { mutateAsync: updateUser, isPending: updateLoading } = useUpdateUserMutation()

  const toggleMembership = async (member: FamilyMember, realIndex: number) => {
    if (!user) return
    try {
      const updatedMember: FamilyMember = {
        ...member,
        status: member.status === 'active' ? 'inactive' : 'active',
      }
      const updatedFamilyMembers = [...user.familyMembers]
      updatedFamilyMembers[realIndex] = updatedMember
      const response = await updateUser({ ...user, familyMembers: updatedFamilyMembers, _id: user._id })
      const nextUserInfo = { ...userInfo!, ...response.user }
      dispatch({ type: 'USER_LOGIN', payload: nextUserInfo })
      localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
      await queryClient.invalidateQueries({ queryKey: ['user', userInfo?._id ?? ''] })
      toast({
        variant: 'default',
        title: updatedMember.status === 'active' ? 'Membership activé' : 'Membership désactivé',
        description: `${member.firstName} ${member.lastName} a été mis à jour.`,
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const toggleRpn = async (member: FamilyMember, realIndex: number) => {
    if (!user) return
    try {
      const nextRpnStatus = member.rpnStatus === 'enrolled' ? 'unsubscribed' : 'pending'
      const updatedMember: FamilyMember = { ...member, rpnStatus: nextRpnStatus }
      const updatedFamilyMembers = [...user.familyMembers]
      updatedFamilyMembers[realIndex] = updatedMember
      const response = await updateUser({ ...user, familyMembers: updatedFamilyMembers, _id: user._id })
      const nextUserInfo = { ...userInfo!, ...response.user }
      dispatch({ type: 'USER_LOGIN', payload: nextUserInfo })
      localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
      await queryClient.invalidateQueries({ queryKey: ['user', userInfo?._id ?? ''] })
      toast({
        variant: 'default',
        title: nextRpnStatus === 'unsubscribed' ? 'Désinscrit du RPN' : 'Inscription RPN en cours',
        description:
          nextRpnStatus === 'unsubscribed'
            ? `${member.firstName} ${member.lastName} a été désinscrit du fonds RPN.`
            : `${member.firstName} ${member.lastName} sera inscrit après confirmation du serveur.`,
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const togglePrimaryRpn = async () => {
    if (!user) return
    try {
      const currentRpnStatus = user.subscription?.rpnStatus ?? 'not_enrolled'
      const nextRpnStatus = currentRpnStatus === 'enrolled' ? 'unsubscribed' : 'pending'
      const response = await updateUser({
        ...user,
        subscription: { ...user.subscription, rpnStatus: nextRpnStatus } as typeof user.subscription,
        _id: user._id,
      })
      const nextUserInfo = { ...userInfo!, ...response.user }
      dispatch({ type: 'USER_LOGIN', payload: nextUserInfo })
      localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
      await queryClient.invalidateQueries({ queryKey: ['user', userInfo?._id ?? ''] })
      toast({
        variant: 'default',
        title: nextRpnStatus === 'unsubscribed' ? 'Désinscrit du RPN' : 'Inscription RPN en cours',
        description:
          nextRpnStatus === 'unsubscribed'
            ? 'Vous avez été désinscrit du fonds RPN.'
            : 'Votre inscription sera confirmée après traitement.',
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const visibleMembers = (user?.familyMembers ?? [])
    .map((m, i) => ({ member: m, realIndex: i }))
    .filter(({ member }) => member.status !== 'deleted')

  return (
    <ProfilLayout>
      {isPending ? (
        <Loading />
      ) : (
        <div className='space-y-4'>
          <MemberCoverageCard
            name={`${user?.origines?.firstName ?? userInfo?.origines?.firstName ?? ''} ${user?.origines?.lastName ?? userInfo?.origines?.lastName ?? ''}`}
            membershipIncluded={user?.subscription?.status === 'active'}
            rpnStatus={user?.subscription?.rpnStatus ?? 'not_enrolled'}
            rpnMatricule={user?.subscription?.rpnMatricule}
            isLoading={updateLoading}
            onToggleRpn={togglePrimaryRpn}
          />

          {visibleMembers.map(({ member, realIndex }) => (
            <MemberCoverageCard
              key={realIndex}
              name={`${member.firstName} ${member.lastName}`}
              relationship={member.relationship}
              membershipIncluded={member.status === 'active'}
              rpnStatus={member.rpnStatus ?? 'not_enrolled'}
              rpnMatricule={member.rpnMatricule}
              isLoading={updateLoading}
              onToggleMembership={() => toggleMembership(member, realIndex)}
              onToggleRpn={() => toggleRpn(member, realIndex)}
            />
          ))}

          <div className='pt-2'>
            <Link to='/dependents' className='text-primary text-sm font-medium hover:underline'>
              Gérer les membres →
            </Link>
          </div>
        </div>
      )}
    </ProfilLayout>
  )
}

export default MaCouverture
