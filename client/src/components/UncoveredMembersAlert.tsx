import { RefreshCw } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUncoveredMembers } from '@/hooks/useUncoveredMembers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FamilyMember } from '@/types'

const formatNames = (members: FamilyMember[]): string =>
  members.map((m) => `${m.firstName} ${m.lastName}`).join(', ')

export const UncoveredMembersAlert = () => {
  const uncoveredMembers = useUncoveredMembers()
  const { userId } = useCurrentUser()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!uncoveredMembers.length) return null

  const count = uncoveredMembers.length
  const names = formatNames(uncoveredMembers)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['user', userId] })
    setIsRefreshing(false)
  }

  return (
    <div className='flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4'>
      <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-orange-600' />
      <div className='flex-1 text-sm'>
        <div className='flex items-center justify-between gap-2'>
          <p className='font-semibold text-orange-800'>
            {count === 1 ? '1 membre non couvert' : `${count} membres non couverts`}
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 disabled:opacity-50'
            title='Vérifier si le paiement a été approuvé'
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Vérifier
          </button>
        </div>
        <p className='mt-1 text-orange-700'>{names}</p>
        <p className='mt-1 text-orange-700'>
          {count === 1
            ? "Ce membre a été ajouté après votre paiement annuel et n'est pas encore couvert."
            : "Ces membres ont été ajoutés après votre paiement annuel et ne sont pas encore couverts."}
        </p>
        <Link
          to='/billing-partiel'
          className='mt-2 inline-block font-medium text-orange-900 underline underline-offset-2'
        >
          Régulariser la couverture
        </Link>
      </div>
    </div>
  )
}
