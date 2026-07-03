import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import Loading from '@/components/Loading'
import apiClient from '@/apiClient'
import {
  useGetRpnPendingQuery,
  type RpnPendingUser,
  type RpnSyncPayload,
  type RpnSyncResult,
} from '@/hooks/rpnSyncHooks'

const RpnSyncPage = () => {
  const { data: users, isPending, error, refetch } = useGetRpnPendingQuery()
  const [results, setResults] = useState<Map<string, RpnSyncResult>>(new Map())
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())

  const [backfillLoading, setBackfillLoading] = useState(false)
  const [backfillResult, setBackfillResult] = useState<{
    fixed: number
    users: Array<{ name: string; members: Array<{ name: string; oldStatus: string; newStatus: string }> }>
  } | null>(null)

  const handleBackfillRpnStatus = async () => {
    setBackfillLoading(true)
    setBackfillResult(null)
    try {
      const { data } = await apiClient.post('api/users/admin/backfill-rpn-status')
      setBackfillResult(data)
      toast({
        title: `Migration terminée — ${data.fixed} membre(s) corrigé(s)`,
        description: data.fixed === 0 ? 'Aucune donnée à corriger.' : 'Voir le détail ci-dessous.',
      })
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la migration.' })
    } finally {
      setBackfillLoading(false)
    }
  }

  const rowKey = (userId: string, payload: RpnSyncPayload) =>
    payload.memberType === 'primary'
      ? `${userId}-primary`
      : `${userId}-${payload.memberId ?? `idx-${payload.memberIndex}`}`

  const handleSync = async (userId: string, payload: RpnSyncPayload) => {
    const key = rowKey(userId, payload)
    setLoadingKeys((prev) => new Set(prev).add(key))
    try {
      const { data } = await apiClient.post<RpnSyncResult>(
        `api/users/admin/rpn-sync/${userId}`,
        payload
      )
      setResults((prev) => new Map(prev).set(key, data))
      if (data.success) {
        toast({ title: 'Synchronisation réussie', description: `Matricule : ${data.matricule}` })
        refetch()
      } else {
        toast({ variant: 'destructive', title: 'Échec de la synchronisation', description: data.error ?? 'Voir les logs serveur.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur réseau', description: 'Impossible de joindre le serveur.' })
    } finally {
      setLoadingKeys((prev) => {
        const s = new Set(prev)
        s.delete(key)
        return s
      })
    }
  }

  if (isPending) return <Loading />
  if (error) return <p className="container mt-16 text-red-500">Erreur lors du chargement des membres en attente.</p>

  return (
    <>
      <SearchEngineOptimization title="Synchronisation RPN" />
      <div className="container mt-16 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Synchronisation RPN</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Membres en attente d'inscription sur notrerpn.org. Cliquez sur «&nbsp;Synchroniser&nbsp;» pour relancer l'inscription.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Correction des données legacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Corrige le champ <code>rpnStatus</code> des membres de famille inscrits sur notrerpn.org
              avant l'ajout de ce champ en base. À exécuter une seule fois.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={backfillLoading}
              onClick={handleBackfillRpnStatus}
              className="border-orange-400 text-orange-700 hover:bg-orange-50"
            >
              {backfillLoading ? 'Migration en cours…' : 'Corriger rpnStatus legacy'}
            </Button>
            {backfillResult !== null && (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs space-y-1">
                <p className="font-semibold text-orange-800">
                  {backfillResult.fixed === 0
                    ? 'Aucun membre à corriger.'
                    : `${backfillResult.fixed} membre(s) corrigé(s) :`}
                </p>
                {backfillResult.users.map((u) => (
                  <div key={u.name}>
                    <p className="font-medium text-orange-900">{u.name}</p>
                    {u.members.map((m) => (
                      <p key={m.name} className="text-orange-700 pl-2">
                        · {m.name} : {m.oldStatus} → {m.newStatus}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {users?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun membre en attente de synchronisation.
            </CardContent>
          </Card>
        ) : (
          users?.map((user) => (
            <UserSyncCard
              key={user.userId}
              user={user}
              results={results}
              loadingKeys={loadingKeys}
              onSync={handleSync}
            />
          ))
        )}
      </div>
    </>
  )
}

type UserSyncCardProps = {
  user: RpnPendingUser
  results: Map<string, RpnSyncResult>
  loadingKeys: Set<string>
  onSync: (userId: string, payload: RpnSyncPayload) => void
}

const UserSyncCard = ({ user, results, loadingKeys, onSync }: UserSyncCardProps) => {
  const hasPrimaryStuck = user.stuckMembers.some((m) => m.isPrimary)
  const primarySynced = results.get(`${user.userId}-primary`)?.success === true

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{user.fullName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {user.stuckMembers.map((member) => {
          const payload: RpnSyncPayload = member.isPrimary
            ? { memberType: 'primary' }
            : { memberType: 'family', memberId: member.memberId, memberIndex: member.memberIndex }
          const key = member.isPrimary
            ? `${user.userId}-primary`
            : `${user.userId}-${member.memberId ?? `idx-${member.memberIndex}`}`
          const result = results.get(key)
          const isLoading = loadingKeys.has(key)
          const familyBlocked = !member.isPrimary && hasPrimaryStuck && !primarySynced

          return (
            <div
              key={key}
              className="flex flex-wrap items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{member.memberName}</span>
                <Badge variant="outline">{member.isPrimary ? 'Principal' : 'Famille'}</Badge>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  {member.rpnStatus}
                </Badge>
                {member.rpnBalance !== undefined && (
                  <span className="text-xs text-muted-foreground">Solde RPN : {member.rpnBalance}$</span>
                )}
                {familyBlocked && (
                  <span className="text-xs italic text-muted-foreground">
                    Synchronisez d'abord le membre principal
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {result && (
                  <Badge
                    className={
                      result.success
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }
                  >
                    {result.success ? `Succès — ${result.matricule}` : 'Échec'}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading || result?.success === true || familyBlocked}
                  onClick={() => onSync(user.userId, payload)}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      En cours…
                    </>
                  ) : (
                    'Synchroniser'
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default RpnSyncPage
