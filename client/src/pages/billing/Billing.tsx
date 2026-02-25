import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store } from '@/lib/Store'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  useGetAccountsByUserIdQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import {
  useGetTransactionsByUserIdQuery,
  useNewTransactionMutation,
} from '@/hooks/transactionHooks'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import {
  buildTopUpReason,
  computeTopUpAllocation,
  getLastRpnTopUpTransactions,
  getMembershipCurrentYearTransactions,
  getTargetFromQuery,
  getTransactionStatusLabel,
  type TopUpTargetWithBoth,
} from '@/lib/billing'
import {
  computeFamilyFeesBreakdown,
  computeFamilyFeesSummary,
  type FamilyFeeBreakdownItem,
} from '@/lib/familyFees'
import { formatCurrency, functionReverse, toastAxiosError } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

type FormErrors = {
  amountInterac?: string
  refInterac?: string
  target?: string
}

const TOP_UP_TARGET_OPTIONS: TopUpTargetWithBoth[] = [
  'both',
  'membership',
  'rpn',
]

const TARGET_LABELS: Record<TopUpTargetWithBoth, string> = {
  membership: 'Membership',
  rpn: 'Fonds RPN',
  both: 'Membership + Fonds RPN',
}

const TARGET_DESCRIPTIONS: Record<TopUpTargetWithBoth, string> = {
  membership: 'Vous reglez uniquement la cotisation membership.',
  rpn: 'Vous alimentez uniquement le fonds RPN.',
  both: 'Vous reglez membership et RPN en une seule transaction.',
}

const getRowAmountByTarget = (
  item: FamilyFeeBreakdownItem,
  target: TopUpTargetWithBoth,
) => {
  if (target === 'membership') return item.membershipAmount
  if (target === 'rpn') return item.rpnAmount
  return item.totalAmount
}

const getBreakdownRowsForTarget = (
  rows: FamilyFeeBreakdownItem[],
  target: TopUpTargetWithBoth,
) => rows.filter((row) => getRowAmountByTarget(row, target) > 0)

const Billing = () => {
  const { state, dispatch } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const { data: accounts } = useGetAccountsByUserIdQuery(userId)
  const { data: transactions = [] } = useGetTransactionsByUserIdQuery(userId)
  const { mutateAsync: updateAccount, isPending: isUpdatingAccount } =
    useUpdateAccountMutation()
  const { mutateAsync: newTransaction, isPending: isCreatingTransaction } =
    useNewTransactionMutation()

  const account = accounts?.[0]
  const familyFeesSummary = useMemo(
    () => computeFamilyFeesSummary(userInfo),
    [userInfo],
  )
  const familyFeeBreakdown = useMemo(
    () => computeFamilyFeesBreakdown(userInfo),
    [userInfo],
  )

  const membershipMinAmount = useMemo(() => {
    if (userInfo?.subscription?.status === 'active') return 25
    return 50
  }, [userInfo?.subscription?.status])

  const defaultMembershipAmount = useMemo(
    () => Math.max(membershipMinAmount, familyFeesSummary.membershipAmount),
    [familyFeesSummary.membershipAmount, membershipMinAmount],
  )
  const defaultRpnAmount = useMemo(
    () => Math.max(20, familyFeesSummary.rpnAmount),
    [familyFeesSummary.rpnAmount],
  )

  const defaultAmounts = useMemo(
    () => ({
      membership: defaultMembershipAmount,
      rpn: defaultRpnAmount,
      both: defaultMembershipAmount + defaultRpnAmount,
    }),
    [defaultMembershipAmount, defaultRpnAmount],
  )

  const initialTarget = useMemo(
    () => getTargetFromQuery(searchParams.get('target')),
    [searchParams],
  )
  const section = searchParams.get('section')

  const [selectedTarget, setSelectedTarget] =
    useState<TopUpTargetWithBoth | null>(initialTarget)
  const [amountInterac, setAmountInterac] = useState<number>(
    initialTarget ? defaultAmounts[initialTarget] : 0,
  )
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const membershipTransactions = useMemo(
    () => getMembershipCurrentYearTransactions(transactions),
    [transactions],
  )
  const rpnTopUps = useMemo(
    () => getLastRpnTopUpTransactions(transactions),
    [transactions],
  )
  const breakdownRows = useMemo(() => {
    if (!selectedTarget) return []
    return getBreakdownRowsForTarget(familyFeeBreakdown, selectedTarget)
  }, [familyFeeBreakdown, selectedTarget])

  useEffect(() => {
    if (!selectedTarget) return
    setAmountInterac(defaultAmounts[selectedTarget])
  }, [defaultAmounts, selectedTarget])

  useEffect(() => {
    if (section !== 'payment') return
    const paymentBlock = document.getElementById('billing-payment-section')
    paymentBlock?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [section])

  const isSubmitting = isUpdatingAccount || isCreatingTransaction

  const onSubmit = async () => {
    if (!selectedTarget) {
      setErrors({ target: 'Veuillez selectionner un type de paiement.' })
      return
    }

    if (!account) {
      setErrors({ target: 'Aucun compte de paiement associe a ce profil.' })
      return
    }

    const schema = createInteracFormSchema(defaultAmounts[selectedTarget])
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
      const currentMembership = account.membership_balance ?? account.solde ?? 0
      const currentRpn = account.rpn_balance ?? 0
      const existingInteracTransactions = account.interac ?? []
      const allocation = computeTopUpAllocation({
        target: selectedTarget,
        amountInterac,
        membershipDueAmount: defaultMembershipAmount,
        rpnDueAmount: defaultRpnAmount,
      })

      const nextMembership = currentMembership + allocation.membershipAmount
      const nextRpn = currentRpn + allocation.rpnAmount
      const nextSolde = nextMembership + nextRpn

      const response = await updateAccount({
        ...account,
        membership_balance: nextMembership,
        rpn_balance: nextRpn,
        solde: nextSolde,
        interac: [...existingInteracTransactions, { amountInterac, refInterac }],
      })

      await newTransaction({
        userId,
        amount: amountInterac,
        type: 'credit',
        reason: buildTopUpReason(selectedTarget),
        refInterac,
        status: 'pending',
      })

      dispatch({ type: 'ACCOUNT_INFOS', payload: response.account })
      localStorage.setItem('accountInfo', JSON.stringify(response.account))
      await queryClient.invalidateQueries({ queryKey: ['accountsByUserId', userId] })
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })

      setRefInterac('')
      toast({
        variant: 'success',
        title: 'Paiement enregistré',
        description:
          'Merci ! Votre paiement sera vérifié dans les prochains jours.',
      })
      navigate('/summary?payment=submitted', { replace: true })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <>
      <SearchEngineOptimization
        title='Facturation'
        description='Paiement et historique des transactions'
      />
      <div className='container mb-10 pt-10'>
        <h1 className='text-3xl font-semibold'>Facturation</h1>

        <Card className='mt-8' id='billing-payment-section'>
          <CardHeader>
            <CardTitle>Paiement</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div>
              <p className='mb-2 font-medium'>Type de paiement</p>
              <RadioGroup
                value={selectedTarget ?? ''}
                onValueChange={(value) => {
                  const nextValue = getTargetFromQuery(value)
                  setSelectedTarget(nextValue)
                  setErrors((prev) => ({ ...prev, target: undefined }))
                }}
                className='grid sm:grid-cols-3 gap-3'
              >
                {TOP_UP_TARGET_OPTIONS.map((target) => {
                  const isSelected = selectedTarget === target
                  return (
                    <Label
                      key={target}
                      htmlFor={target}
                      className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <span className='flex items-start gap-3'>
                        <RadioGroupItem value={target} id={target} className='mt-1' />
                        <span>
                          <span className='block text-sm font-semibold'>
                            {TARGET_LABELS[target]}
                          </span>
                          <span className='block text-xs text-muted-foreground'>
                            {TARGET_DESCRIPTIONS[target]}
                          </span>
                        </span>
                      </span>
                      <span className='whitespace-nowrap text-sm font-semibold'>
                        {formatCurrency(defaultAmounts[target])}
                      </span>
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
                <Label htmlFor='amountInterac'>Montant envoyé</Label>
                <Input
                  id='amountInterac'
                  type='number'
                  min={0}
                  value={amountInterac}
                  onChange={(event) =>
                    setAmountInterac(Number(event.target.value || 0))
                  }
                />
                {selectedTarget ? (
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Montant minimal: {formatCurrency(defaultAmounts[selectedTarget])}
                    {selectedTarget === 'both'
                      ? ' (tout surplus sera ajoute au fonds RPN).'
                      : '.'}
                  </p>
                ) : null}
                {errors.amountInterac ? (
                  <p className='mt-1 text-sm text-destructive'>
                    {errors.amountInterac}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor='refInterac'>
                  Code interact fourni par la banque (regarde dans tes courriels)
                </Label>
                <Input
                  id='refInterac'
                  value={refInterac}
                  onChange={(event) => setRefInterac(event.target.value)}
                  placeholder='CA1234567890'
                />
                {errors.refInterac ? (
                  <p className='mt-1 text-sm text-destructive'>
                    {errors.refInterac}
                  </p>
                ) : null}
              </div>
            </div>

            <Button onClick={onSubmit} disabled={isSubmitting} className='w-full sm:w-auto'>
              Valider Paiement
            </Button>

            <div className='rounded-lg border bg-slate-50 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-medium'>Récapitulatif à payer</p>
                  <p className='text-xs text-muted-foreground'>
                    Montants calculés selon votre situation familiale.
                  </p>
                </div>
                <Button asChild variant='link' className='h-auto p-0 text-xs'>
                  <Link to='/dependents'>Ajouter une personne à charge</Link>
                </Button>
              </div>

              {selectedTarget ? (
                <div className='mt-3 space-y-2'>
                  {breakdownRows.map((item) => (
                    <div key={item.id} className='rounded-lg border bg-background p-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='text-sm font-semibold leading-tight'>
                            {item.fullName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {item.relationshipLabel}
                          </p>
                        </div>
                        <p className='text-sm font-semibold'>
                          {formatCurrency(getRowAmountByTarget(item, selectedTarget))}
                        </p>
                      </div>
                      {selectedTarget === 'both' ? (
                        <div className='mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground'>
                          <p>Membership: {formatCurrency(item.membershipAmount)}</p>
                          <p>RPN Minimal: {formatCurrency(item.rpnAmount)}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='mt-3 text-sm text-muted-foreground'>
                  Selectionnez un type de paiement pour afficher le détail.
                </p>
              )}

              <div className='mt-3 rounded-lg bg-background p-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span>Total Membership</span>
                  <strong>{formatCurrency(defaultMembershipAmount)}</strong>
                </div>
                <div className='mt-1 flex items-center justify-between'>
                  <span>Total Fonds RPN</span>
                  <strong>{formatCurrency(defaultRpnAmount)}</strong>
                </div>
                <div className='mt-2 flex items-center justify-between border-t pt-2 text-base'>
                  <span className='font-semibold'>Total à payer maintenant</span>
                  <strong>
                    {formatCurrency(
                      selectedTarget ? defaultAmounts[selectedTarget] : 0,
                    )}
                  </strong>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        <div className='mt-10 grid gap-6 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Historique Membership</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable
                transactions={membershipTransactions}
                emptyMessage='Aucune transaction Membership pour cette année.'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique Fonds RPN</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable
                transactions={rpnTopUps}
                emptyMessage='Aucune recharge RPN trouvée.'
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

const BillingTable = ({
  transactions,
  emptyMessage,
}: {
  transactions: ReturnType<typeof getMembershipCurrentYearTransactions>
  emptyMessage: string
}) => {
  if (!transactions.length) {
    return <p className='text-sm text-muted-foreground'>{emptyMessage}</p>
  }

  return (
    <div className='space-y-3'>
      {transactions.map((transaction) => (
        <div key={transaction._id} className='rounded border p-3 text-sm'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='font-medium'>
              {transaction.createdAt
                ? functionReverse(String(transaction.createdAt).substring(0, 10))
                : '-'}
            </p>
            <Badge
              className={
                transaction.status === 'completed'
                  ? 'bg-green-600'
                  : transaction.status === 'failed'
                    ? 'bg-red-600'
                    : 'bg-orange-500'
              }
            >
              {getTransactionStatusLabel(transaction.status)}
            </Badge>
          </div>
          <p className='mt-1'>
            Montant: <strong>{formatCurrency(transaction.amount)}</strong>
          </p>
          <p className='mt-1'>Motif: {transaction.reason}</p>
          <p className='mt-1'>Code Interac: {transaction.refInterac || '-'}</p>
        </div>
      ))}
    </div>
  )
}

export default Billing
