import { useContext } from 'react'
import { Store } from '@/lib/Store'
import { useGetUserDetailsQuery } from './userHooks'

/**
 * Retourne les données fraîches de l'utilisateur connecté depuis l'API,
 * avec le Store/localStorage comme fallback pendant le chargement initial.
 *
 * À utiliser à la place de `useContext(Store).state.userInfo` dès qu'un
 * calcul métier (frais, membership, RPN) dépend des données utilisateur.
 */
export const useCurrentUser = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''

  const { data: freshUser, isPending } = useGetUserDetailsQuery(userId)

  return {
    user: freshUser ?? userInfo,
    userId,
    isPending: isPending && !userInfo,
  }
}
