import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { getMemberFeeConfig, resolveFamilyMemberRpnStatus } from '@/lib/familyMemberRules'
import { toastAxiosError } from '@/lib/utils'
import { FamilyMember } from '@/types'
import type { RpnStatus } from '@/types/User'
import apiClient from '@/apiClient'

const getMembershipBadge = (member: FamilyMember) => {
  if (member.status !== 'active') {
    return <Badge variant='outline' className='font-normal text-red-600 border-red-400'>Exclu</Badge>
  }
  const { isMembershipActive } = getMemberFeeConfig(member)
  if (isMembershipActive && member.membershipCoveredThisYear === null) {
    return <Badge className='bg-yellow-100 text-yellow-800 font-normal'>En attente</Badge>
  }
  return <Badge className='bg-green-100 text-green-800 font-normal'>Inclus</Badge>
}

const RPN_STATUS_BADGE: Record<RpnStatus, { label: string; className: string }> = {
  enrolled:     { label: 'Inscrit',            className: 'bg-green-100 text-green-800' },
  pending:      { label: 'En attente',          className: 'bg-yellow-100 text-yellow-800' },
  not_enrolled: { label: 'Non inscrit',         className: 'bg-gray-100 text-gray-700' },
  unsubscribed: { label: 'Désinscrit',          className: 'bg-red-100 text-red-800' },
}

const getRpnBadge = (rpnStatus?: RpnStatus) => {
  const status = rpnStatus ?? 'not_enrolled'
  const { label, className } = RPN_STATUS_BADGE[status]
  return <Badge className={`${className} font-normal`}>{label}</Badge>
}

const useRetryRpnMutation = (userId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (memberId: string) =>
      (await apiClient.post(`api/users/${userId}/retry-rpn-family/${memberId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast({ variant: 'default', title: 'Inscription RPN réussie', description: 'Le membre a été inscrit sur notrerpn.org.' })
    },
    onError: (error) => toastAxiosError(error),
  })
}

type Props = {
  familyMembers?: FamilyMember[]
  userId: string
}

const AccountFamilyCard = ({ familyMembers, userId }: Props) => {
  const { mutate: retryRpn, isPending } = useRetryRpnMutation(userId)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const handleRetry = (memberId: string) => {
    setRetryingId(memberId)
    retryRpn(memberId, { onSettled: () => setRetryingId(null) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personnes à charge</CardTitle>
      </CardHeader>
      <CardContent>
        {familyMembers && familyMembers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Statut RPN</TableHead>
                <TableHead>Matricule RPN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {familyMembers.map((member, index) => {
                const memberId = member._id ?? `index-${index}`
                const isRetrying = retryingId === memberId && isPending
                return (
                  <TableRow key={`${member.firstName}-${member.lastName}-${index}`}>
                    <TableCell>
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.relationship || '-'}</TableCell>
                    <TableCell>{getMembershipBadge(member)}</TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        {getRpnBadge(resolveFamilyMemberRpnStatus(member))}
                        {resolveFamilyMemberRpnStatus(member) === 'pending' && member._id && (
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-6 text-xs px-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                            disabled={isRetrying}
                            onClick={() => handleRetry(memberId)}
                          >
                            <RotateCcw className='h-3 w-3 mr-1' />
                            {isRetrying ? 'En cours…' : 'Réessayer'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{member.rpnMatricule || '-'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className='text-sm text-muted-foreground'>
            Aucune personne à charge enregistrée.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default AccountFamilyCard
