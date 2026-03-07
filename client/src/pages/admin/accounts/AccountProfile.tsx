import { useEffect, useMemo, useState } from 'react'
import Loading from '@/components/Loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/components/ui/use-toast'
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
import {
  useGetTransactionsByUserIdQuery,
  useNewTransactionMutation,
} from '@/hooks/transactionHooks'
import { useGetUserDetailsQuery } from '@/hooks/userHooks'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import { buildTopUpReason, computeTopUpAllocation } from '@/lib/billing'
import { canadianResidenceStatus } from '@/lib/constant'
import {
  computeFamilyFeesSummary,
} from '@/lib/familyFees'
import {
  TOP_UP_TARGET_OPTIONS,
  TARGET_DESCRIPTIONS,
  TARGET_LABELS,
  computeMinimumPaymentByTarget,
  computeOutstandingTopUpAmounts,
  computeRecommendedTopUpAmounts,
  computeSuggestedPaymentAmount,
  type TargetAmountMap,
} from '@/lib/paymentPlan'
import {
  formatCanadianPhone,
  formatCurrency,
  functionReverse,
  toastAxiosError,
} from '@/lib/utils'
import {
  getTransactionStatusBadgeClass,
  getTransactionStatusLabel,
} from '@/lib/transactionStatus'
import { Account, type TopUpTargetWithBoth } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
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

type FormErrors = {
  amountInterac?: string
  refInterac?: string
  target?: string
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
  const queryClient = useQueryClient()
  const { mutateAsync: newTransaction, isPending: isCreatingTransaction } =
    useNewTransactionMutation()

  const familyFeesSummary = useMemo(() => computeFamilyFeesSummary(user), [user])
  const recommendedTopUp = useMemo(
    () =>
      computeRecommendedTopUpAmounts({
        subscriptionStatus: user?.subscription?.status,
        membershipDueAmount: familyFeesSummary.membershipAmount,
        rpnDueAmount: familyFeesSummary.rpnAmount,
      }),
    [
      familyFeesSummary.membershipAmount,
      familyFeesSummary.rpnAmount,
      user?.subscription?.status,
    ]
  )

  const currentMembershipBalance =
    currentAccount?.membership_balance ?? currentAccount?.solde ?? 0
  const currentRpnBalance = currentAccount?.rpn_balance ?? 0

  const outstandingTopUp = useMemo(
    () =>
      computeOutstandingTopUpAmounts({
        recommendedMembershipAmount: recommendedTopUp.membershipAmount,
        recommendedRpnAmount: recommendedTopUp.rpnAmount,
        currentMembershipBalance,
        currentRpnBalance,
      }),
    [
      recommendedTopUp.membershipAmount,
      recommendedTopUp.rpnAmount,
      currentMembershipBalance,
      currentRpnBalance,
    ]
  )

  const minimumByTarget = useMemo(
    () => computeMinimumPaymentByTarget(outstandingTopUp.targetAmounts),
    [outstandingTopUp.targetAmounts]
  )
  const suggestedByTarget = useMemo<TargetAmountMap>(
    () => ({
      membership: computeSuggestedPaymentAmount({
        target: 'membership',
        outstandingByTarget: outstandingTopUp.targetAmounts,
        recommendedByTarget: recommendedTopUp.targetAmounts,
      }),
      rpn: computeSuggestedPaymentAmount({
        target: 'rpn',
        outstandingByTarget: outstandingTopUp.targetAmounts,
        recommendedByTarget: recommendedTopUp.targetAmounts,
      }),
      both: computeSuggestedPaymentAmount({
        target: 'both',
        outstandingByTarget: outstandingTopUp.targetAmounts,
        recommendedByTarget: recommendedTopUp.targetAmounts,
      }),
    }),
    [outstandingTopUp.targetAmounts, recommendedTopUp.targetAmounts]
  )

  const initialTarget: TopUpTargetWithBoth =
    outstandingTopUp.targetAmounts.both > 0 ? 'both' : 'membership'
  const [selectedTarget, setSelectedTarget] =
    useState<TopUpTargetWithBoth>(initialTarget)
  const [amountInterac, setAmountInterac] = useState<number>(
    suggestedByTarget[initialTarget]
  )
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const isSavingPayment = isCreatingTransaction

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

  useEffect(() => {
    setAmountInterac(suggestedByTarget[selectedTarget])
  }, [selectedTarget, suggestedByTarget])

  const onSubmitPayment = async () => {
    const schema = createInteracFormSchema(minimumByTarget[selectedTarget])
    const validation = schema.safeParse({ amountInterac, refInterac })

    if (!validation.success) {
      const nextErrors: FormErrors = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'amountInterac') {
          nextErrors.amountInterac = issue.message
        }
        if (issue.path[0] === 'refInterac') {
          nextErrors.refInterac = issue.message
        }
      }
      setErrors(nextErrors)
      return
    }

    try {
      setErrors({})
      const allocation = computeTopUpAllocation({
        target: selectedTarget,
        amountInterac,
        membershipDueAmount: outstandingTopUp.membershipAmount,
        rpnDueAmount: outstandingTopUp.rpnAmount,
      })

      await newTransaction({
        userId,
        amount: amountInterac,
        type: 'credit',
        fundType: selectedTarget,
        membershipAmount: allocation.membershipAmount,
        rpnAmount: allocation.rpnAmount,
        reason: buildTopUpReason(selectedTarget),
        refInterac,
        status: 'pending',
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accountsByUserId', userId] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
      ])

      setRefInterac('')
      toast({
        variant: 'success',
        title: 'Paiement enregistré',
        description:
          "Le paiement a été ajouté. Il apparaîtra dans l'historique après vérification.",
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

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
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Soldes</CardTitle>
            <p className="text-xs text-muted-foreground mt-2">
              Montants courants des comptes
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4" /> Solde RPN
              </div>
              <p className="text-3xl font-semibold">
                {formatCurrency(currentRpnBalance)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4" /> Solde Membership
              </div>
              <p className="text-3xl font-semibold">
                {formatCurrency(currentMembershipBalance)}
              </p>
            </div>
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
              <p className='text-muted-foreground'>Occupation</p>
              <p className='font-medium'>{user.register?.occupation}</p>
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
            <div>
              <p className='text-muted-foreground'>Adresse</p>
              <p className='font-medium'>{user.infos?.address || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-4 border-primary/20'>
        <CardHeader className='space-y-2'>
          <CardTitle>Assistant de paiement pour utilisateur novice</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Choisissez le type, vérifiez le montant dû selon la famille, puis enregistrez le paiement Interac.
          </p>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>Membership à payer par le membre</p>
              <p className='mt-1 text-lg font-semibold'>
                {formatCurrency(recommendedTopUp.membershipAmount)}
              </p>
            </div>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>montant minimal RPN à payer</p>
              <p className='mt-1 text-lg font-semibold'>
                {formatCurrency(recommendedTopUp.rpnAmount)}
              </p>
            </div>
          </div>

          <div>
            <p className='mb-2 text-sm font-medium'>Type de paiement à enregistrer</p>
            <RadioGroup
              value={selectedTarget}
              onValueChange={(value) => {
                const nextTarget = value as TopUpTargetWithBoth
                if (!TOP_UP_TARGET_OPTIONS.includes(nextTarget)) return
                setSelectedTarget(nextTarget)
                setErrors((prev) => ({ ...prev, target: undefined }))
              }}
              className='grid gap-3 sm:grid-cols-3'
            >
              {TOP_UP_TARGET_OPTIONS.map((target) => {
                const isSelected = selectedTarget === target
                return (
                  <Label
                    key={target}
                    htmlFor={`admin-${target}`}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex items-start gap-3'>
                        <RadioGroupItem value={target} id={`admin-${target}`} className='mt-1' />
                        <div>
                          <p className='text-sm font-semibold'>{TARGET_LABELS[target]}</p>
                          <p className='text-xs text-muted-foreground'>
                            {TARGET_DESCRIPTIONS[target]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>
            {errors.target ? (
              <p className='mt-1 text-sm text-destructive'>{errors.target}</p>
            ) : null}
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='amountInterac'>Montant reçu</Label>
              </div>
              <Input
                id='amountInterac'
                type='number'
                min={0}
                value={amountInterac}
                onChange={(event) =>
                  setAmountInterac(Number(event.target.value || 0))
                }
              />
              <p className='mt-1 text-xs text-muted-foreground'>
                Minimum requis: {formatCurrency(minimumByTarget[selectedTarget])}
                {selectedTarget === 'both'
                  ? ' (si dépassement, le surplus est ajouté au fonds RPN).'
                  : '.'}
              </p>
              {errors.amountInterac ? (
                <p className='mt-1 text-sm text-destructive'>{errors.amountInterac}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor='refInterac'>
                Code Interac communiqué par sa banque
              </Label>
              <Input
                id='refInterac'
                value={refInterac}
                onChange={(event) => setRefInterac(event.target.value)}
                placeholder='CA1we0Tq90'
              />
              {errors.refInterac ? (
                <p className='mt-1 text-sm text-destructive'>{errors.refInterac}</p>
              ) : null}
            </div>
          </div>

          <div className='sticky bottom-0 z-10 -mx-2 border-t bg-background/95 px-2 py-3 backdrop-blur sm:static sm:m-0 sm:border-none sm:bg-transparent sm:p-0'>
            <Button
              type='button'
              onClick={onSubmitPayment}
              disabled={isSavingPayment}
              className='w-full sm:w-auto'
            >
              {isSavingPayment ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                        <Badge className={getTransactionStatusBadgeClass(tx.status)}>
                          {getTransactionStatusLabel(tx.status)}
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
