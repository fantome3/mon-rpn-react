import Loading from '@/components/Loading'
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
import {
  useGetAccountsByUserIdQuery,
  useGetAccountsQuery,
} from '@/hooks/accountHooks'
import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'
import { useGetUserDetailsQuery } from '@/hooks/userHooks'
import { canadianResidenceStatus } from '@/lib/constant'
import {
  ToLocaleStringFunc,
  formatCanadianPhone,
  formatCurrency,
  functionReverse,
  toastAxiosError,
} from '@/lib/utils'
import { Account } from '@/types'
import { ArrowLeft, ArrowRight, UserRound, Wallet } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const getUserIdFromAccount = (account?: Account) =>
  String(account?.userId?._id ?? account?.userId ?? '')

const getResidenceStatusLabel = (value?: string) =>
  canadianResidenceStatus.find((s) => s.value === value)?.label || '-'

const toDisplayDate = (value?: string | Date) => {
  if (!value) return '-'
  const dateStr = value.toString().substring(0, 10)
  return functionReverse(dateStr) || '-'
}

const AccountProfile = () => {
  const { userId = '' } = useParams()
  const navigate = useNavigate()

  const { data: allAccounts, isPending: isPendingAccounts } = useGetAccountsQuery()
  const { data: userAccounts, isPending: isPendingUserAccount } =
    useGetAccountsByUserIdQuery(userId)
  const {
    data: user,
    isPending: isPendingUser,
    error: userError,
  } = useGetUserDetailsQuery(userId)
  const { data: transactions, isPending: isPendingTransactions } =
    useGetTransactionsByUserIdQuery(userId)

  const accountsList: Account[] = Array.isArray(allAccounts) ? allAccounts : []
  const userAccountsList: Account[] = Array.isArray(userAccounts) ? userAccounts : []

  const currentAccount =
    userAccountsList.length > 0 ? userAccountsList[userAccountsList.length - 1] : undefined

  const currentIndex = accountsList.findIndex(
    (account: Account) => getUserIdFromAccount(account) === userId
  )
  const previousAccount =
    currentIndex > 0 ? accountsList[currentIndex - 1] : undefined
  const nextAccount =
    currentIndex >= 0 && currentIndex < accountsList.length - 1
      ? accountsList[currentIndex + 1]
      : undefined

  const lastTransactions = [...(transactions ?? [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 4)

  if (
    isPendingAccounts ||
    isPendingUserAccount ||
    isPendingUser ||
    isPendingTransactions
  ) {
    return <Loading />
  }

  if (userError || !user) {
    toastAxiosError(userError)
    return (
      <div className='container mt-16 mb-10'>
        <Button asChild variant='outline'>
          <Link to='/admin/accounts'>Retour aux comptes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='container mt-14 mb-10'>
      <div className='rounded-xl border bg-gradient-to-r from-slate-50 via-white to-emerald-50 p-5 md:p-7'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-xs uppercase tracking-widest text-muted-foreground'>
              Profil membre
            </p>
            <h1 className='text-2xl md:text-3xl font-semibold'>
              {user.origines?.firstName} {user.origines?.lastName}
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              ID utilisateur: {user._id}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              disabled={!previousAccount}
              onClick={() =>
                navigate(
                  `/admin/accounts/${getUserIdFromAccount(previousAccount)}/profile`
                )
              }
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Précédent
            </Button>
            <Button
              variant='outline'
              disabled={!nextAccount}
              onClick={() =>
                navigate(`/admin/accounts/${getUserIdFromAccount(nextAccount)}/profile`)
              }
            >
              Suivant
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
            <Button asChild>
              <Link to='/admin/accounts'>Retour comptes</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Wallet className='h-4 w-4' /> Solde RPN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>
              {ToLocaleStringFunc(currentAccount?.rpn_balance ?? 0)}
            </p>
            <p className='text-xs text-muted-foreground mt-2'>Montant courant du compte</p>
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserRound className='h-4 w-4' /> Renseignements personnels
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
            <div>
              <p className='text-muted-foreground'>Prénom</p>
              <p className='font-medium'>{user.origines?.firstName || '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Nom</p>
              <p className='font-medium'>{user.origines?.lastName || '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Date de naissance</p>
              <p className='font-medium'>{toDisplayDate(user.origines?.birthDate)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Pays d'origine</p>
              <p className='font-medium'>{user.origines?.nativeCountry || '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Téléphone</p>
              <p className='font-medium'>{formatCanadianPhone(user.infos?.tel)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Email</p>
              <p className='font-medium'>{user.register?.email || '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Pays de résidence</p>
              <p className='font-medium'>{user.infos?.residenceCountry || '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Statut au Canada</p>
              <Badge className='font-normal'>
                {getResidenceStatusLabel(user.infos?.residenceCountryStatus)}
              </Badge>
            </div>
            <div className='sm:col-span-2'>
              <p className='text-muted-foreground'>Adresse</p>
              <p className='font-medium'>{user.infos?.address || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'>
        <Card>
          <CardHeader>
            <CardTitle>Personnes à charge</CardTitle>
          </CardHeader>
          <CardContent>
            {user.familyMembers && user.familyMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Relation</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.familyMembers.map((member, index) => (
                    <TableRow key={`${member.firstName}-${member.lastName}-${index}`}>
                      <TableCell>
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.relationship || '-'}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className='font-normal'>
                          {member.status || '-'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Aucune personne à charge enregistrée.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4 dernières transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {lastTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastTransactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{toDisplayDate(tx.createdAt)}</TableCell>
                      <TableCell>{tx.type === 'credit' ? 'Recharge' : 'Dépense'}</TableCell>
                      <TableCell
                        className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            tx.status === 'completed'
                              ? 'bg-green-600'
                              : tx.status === 'pending'
                              ? 'bg-yellow-500'
                              : tx.status === 'awaiting_payment'
                              ? 'bg-blue-500'
                              : 'bg-red-600'
                          }
                        >
                          {tx.status === 'completed'
                            ? 'Réussie'
                            : tx.status === 'pending'
                            ? 'En approbation'
                            : tx.status === 'awaiting_payment'
                            ? 'En attente paiement'
                            : 'Échouée'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Aucune transaction trouvée.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AccountProfile
