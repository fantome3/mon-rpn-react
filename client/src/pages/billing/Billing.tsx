import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store } from '@/lib/Store'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  useGetTransactionsByUserIdQuery,
  useNewTransactionMutation,
} from '@/hooks/transactionHooks'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import {
  buildTopUpReason,
  canPrimaryMemberTopUpRpn,
  computeTopUpAllocation,
  getTransactionAmountByFund,
  getMembershipCurrentYearTransactions,
  getRpnCurrentYearTransactions,
  getTargetFromQuery,
  getTransactionStatusLabel,
  isRpnTopUpTarget,
  RPN_PAYMENT_BLOCK_MESSAGE,
  type FundAmountContext,
  type TopUpTargetWithBoth,
} from '@/lib/billing'
import { getTransactionStatusBadgeClass } from '@/lib/transactionStatus'
import {
  computeFamilyFeesBreakdown,
  computeFamilyFeesSummary,
} from '@/lib/familyFees'
import {
  TOP_UP_TARGET_OPTIONS,
  TARGET_DESCRIPTIONS,
  TARGET_LABELS,
  computeRecommendedTopUpAmounts,
  getBreakdownRowsForTarget,
  getRowAmountByTarget,
} from '@/lib/paymentPlan'
import { formatCurrency, functionReverse, toastAxiosError } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import type { Transaction } from '@/types'

type FormErrors = {
  amountInterac?: string
  refInterac?: string
  target?: string
}

const Billing = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const { data: transactions = [] } = useGetTransactionsByUserIdQuery(userId)
  const { mutateAsync: newTransaction, isPending: isCreatingTransaction } =
    useNewTransactionMutation()
  const familyFeesSummary = useMemo(
    () => computeFamilyFeesSummary(userInfo),
    [userInfo],
  )
  const familyFeeBreakdown = useMemo(
    () => computeFamilyFeesBreakdown(userInfo),
    [userInfo],
  )

  const recommendedTopUp = useMemo(
    () =>
      computeRecommendedTopUpAmounts({
        occupation: userInfo?.register?.occupation,
        membershipDueAmount: familyFeesSummary.membershipAmount,
        rpnDueAmount: familyFeesSummary.rpnAmount,
      }),
    [
      familyFeesSummary.membershipAmount,
      familyFeesSummary.rpnAmount,
      userInfo?.register?.occupation,
    ],
  )

  const defaultMembershipAmount = recommendedTopUp.membershipAmount
  const defaultRpnAmount = recommendedTopUp.rpnAmount
  const defaultAmounts = recommendedTopUp.targetAmounts

  const initialTarget = useMemo(
    () => getTargetFromQuery(searchParams.get('target')),
    [searchParams],
  )
  const section = searchParams.get('section')

  const [selectedTarget, setSelectedTarget] =
    useState<TopUpTargetWithBoth | null>(initialTarget)
  const [amountInterac, setAmountInterac] = useState<string>(
    initialTarget ? String(defaultAmounts[initialTarget]) : '',
  )
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const membershipTransactions = useMemo(
    () => getMembershipCurrentYearTransactions(transactions),
    [transactions],
  )
  const rpnTransactions = useMemo(
    () => getRpnCurrentYearTransactions(transactions),
    [transactions],
  )
  const canPayRpn = useMemo(
    () =>
      canPrimaryMemberTopUpRpn({
        isPrimaryMember: userInfo?.primaryMember,
        transactions,
        subscription: userInfo?.subscription,
      }),
    [transactions, userInfo?.primaryMember, userInfo?.subscription],
  )
  const breakdownRows = useMemo(() => {
    if (!selectedTarget) return []
    return getBreakdownRowsForTarget(familyFeeBreakdown, selectedTarget)
  }, [familyFeeBreakdown, selectedTarget])

  useEffect(() => {
    if (!selectedTarget) return
    setAmountInterac(String(defaultAmounts[selectedTarget]))
  }, [defaultAmounts, selectedTarget])

  useEffect(() => {
    if (!selectedTarget || !isRpnTopUpTarget(selectedTarget) || canPayRpn) return
    setSelectedTarget('membership')
    setErrors((prev) => ({ ...prev, target: RPN_PAYMENT_BLOCK_MESSAGE }))
  }, [canPayRpn, selectedTarget])

  useEffect(() => {
    if (section !== 'payment') return
    const paymentBlock = document.getElementById('billing-payment-section')
    paymentBlock?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [section])

  const isSubmitting = isCreatingTransaction

  const onSubmit = async () => {
    if (!selectedTarget) {
      setErrors({ target: 'Veuillez selectionner un type de paiement.' })
      return
    }

    if (isRpnTopUpTarget(selectedTarget) && !canPayRpn) {
      setErrors({ target: RPN_PAYMENT_BLOCK_MESSAGE })
      toast({
        variant: 'destructive',
        title: 'Paiement RPN bloque',
        description: RPN_PAYMENT_BLOCK_MESSAGE,
      })
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
      const validatedAmount = validation.data.amountInterac
      const allocation = computeTopUpAllocation({
        target: selectedTarget,
        amountInterac: validatedAmount,
        membershipDueAmount: defaultMembershipAmount,
        rpnDueAmount: defaultRpnAmount,
      })

      await newTransaction({
        userId,
        amount: validatedAmount,
        type: 'credit',
        fundType: selectedTarget,
        membershipAmount: allocation.membershipAmount,
        rpnAmount: allocation.rpnAmount,
        reason: buildTopUpReason(selectedTarget),
        refInterac,
        status: 'pending',
      })

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
                <CardDescription>
                  Depuis votre compte bancaire, faire le virement Interac à l'adresse courriel suivante <strong>acq.quebec@gmail.com</strong>
                   et utiliser si demandé le mot de passe <strong>monrpn</strong>
                </CardDescription>
              </CardHeader>
          <CardContent className='space-y-5'>
            <div>
              <p className='mb-2 font-medium'>Type de paiement</p>
              <RadioGroup
                value={selectedTarget ?? ''}
                onValueChange={(value) => {
                  const nextValue = getTargetFromQuery(value)
                  if (nextValue && isRpnTopUpTarget(nextValue) && !canPayRpn) {
                    setErrors((prev) => ({
                      ...prev,
                      target: RPN_PAYMENT_BLOCK_MESSAGE,
                    }))
                    return
                  }
                  setSelectedTarget(nextValue)
                  setErrors((prev) => ({ ...prev, target: undefined }))
                }}
                className='grid sm:grid-cols-3 gap-3'
              >
                {TOP_UP_TARGET_OPTIONS.map((target) => {
                  const isSelected = selectedTarget === target
                  const isDisabled = isRpnTopUpTarget(target) && !canPayRpn
                  return (
                    <Label
                      key={target}
                      htmlFor={target}
                      className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${isDisabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'
                        } ${isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    >
                      <span className='flex items-start gap-3'>
                        <RadioGroupItem
                          value={target}
                          id={target}
                          className='mt-1'
                          disabled={isDisabled}
                        />
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
              {!canPayRpn ? (
                <p className='mt-1 text-xs text-muted-foreground'>
                  Le mode RPN seul est bloqué tant que votre membership annuel
                  (membre principal + personnes à charge) n'est pas valide.
                </p>
              ) : null}
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='amountInterac'>Montant interact envoyé</Label>
                <Input
                  id='amountInterac'
                  type='number'
                  min={0}
                  value={amountInterac}
                  onChange={(event) => setAmountInterac(event.target.value)}
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
                <Label htmlFor="refInterac" className="text-xs">
                  Numéro de référence interact fourni par la banque après virement (voir tes courriels)
                </Label>
                <Input
                  id='refInterac'
                  value={refInterac}
                  onChange={(event) => setRefInterac(event.target.value)}
                  placeholder='C2Km0'
                />
                {errors.refInterac ? (
                  <p className='mt-1 text-sm text-destructive'>
                    {errors.refInterac}
                  </p>
                ) : null}
              </div>
            </div>

                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className='w-full sm:w-auto'
                >
                  Valider Paiement
                </Button>
                <Button asChild variant='link' className='h-auto p-5 text-xs'>
                  <Link to='/faq#facturation'>En savoir plus sur le paiement?</Link>
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
                    <div
                      key={item.id}
                      className='rounded-lg border bg-background p-3'
                    >
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
                          {formatCurrency(
                            getRowAmountByTarget(item, selectedTarget),
                          )}
                        </p>
                      </div>
                      {selectedTarget === 'both' ? (
                        <div className='mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground'>
                          <p>
                            Membership: {formatCurrency(item.membershipAmount)}
                          </p>
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
                fund='membership'
                amountContext={{
                  membershipDueAmount: defaultMembershipAmount,
                  rpnDueAmount: defaultRpnAmount,
                }}
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
                transactions={rpnTransactions}
                fund='rpn'
                amountContext={{
                  membershipDueAmount: defaultMembershipAmount,
                  rpnDueAmount: defaultRpnAmount,
                }}
                emptyMessage='Aucune transaction RPN pour cette annee.'
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
  fund,
  amountContext,
  emptyMessage,
}: {
  transactions: Transaction[]
  fund: 'membership' | 'rpn'
  amountContext: FundAmountContext
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
              className={getTransactionStatusBadgeClass(transaction.status)}
            >
              {getTransactionStatusLabel(transaction.status)}
            </Badge>
          </div>
          <p className='mt-1'>
            Montant:{' '}
            <strong>
              {formatCurrency(
                getTransactionAmountByFund(transaction, fund, amountContext),
              )}
            </strong>
          </p>
          <p className='mt-1'>Motif: {transaction.reason}</p>
          <p className='mt-1'>Code Interac: {transaction.refInterac || '-'}</p>
        </div>
      ))}
    </div>
  )
}

export default Billing
