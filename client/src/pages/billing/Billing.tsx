import { useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Store } from '@/lib/Store'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  getLastRpnTopUpTransactions,
  getMembershipCurrentYearTransactions,
  getTargetFromQuery,
  getTransactionStatusLabel,
  TopUpTarget,
} from '@/lib/billing'
import { computeFamilyFeesSummary } from '@/lib/familyFees'
import { formatCurrency, functionReverse, toastAxiosError } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

type FormErrors = {
  amountInterac?: string
  refInterac?: string
  target?: string
}

const Billing = () => {
  const { state, dispatch } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''
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
    [userInfo]
  )

  const membershipMinAmount = useMemo(() => {
    if (userInfo?.subscription?.status === 'active') return 25
    return 50
  }, [userInfo?.subscription?.status])

  const defaultAmounts = useMemo(
    () => ({
      membership: Math.max(
        membershipMinAmount,
        familyFeesSummary.membershipAmount
      ),
      rpn: Math.max(20, familyFeesSummary.rpnAmount),
    }),
    [familyFeesSummary.membershipAmount, familyFeesSummary.rpnAmount, membershipMinAmount]
  )

  const initialTarget = useMemo(
    () => getTargetFromQuery(searchParams.get('target')),
    [searchParams]
  )
  const section = searchParams.get('section')

  const [selectedTarget, setSelectedTarget] = useState<TopUpTarget | null>(
    initialTarget
  )
  const [amountInterac, setAmountInterac] = useState<number>(
    initialTarget ? defaultAmounts[initialTarget] : 0
  )
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmationMessage, setConfirmationMessage] = useState('')

  const membershipTransactions = useMemo(
    () => getMembershipCurrentYearTransactions(transactions),
    [transactions]
  )
  const rpnTopUps = useMemo(
    () => getLastRpnTopUpTransactions(transactions),
    [transactions]
  )

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
      setErrors({ target: 'Veuillez selectionner un type de renflouement.' })
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

      const nextMembership =
        selectedTarget === 'membership'
          ? currentMembership + amountInterac
          : currentMembership
      const nextRpn =
        selectedTarget === 'rpn' ? currentRpn + amountInterac : currentRpn
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
      setConfirmationMessage(
        "Merci ! Votre paiement sera verifie dans les prochains jours et votre profil sera mis a jour en consequent. Retrouvez le suivi dans l'onglet Mes Cotisations."
      )
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <>
      <SearchEngineOptimization title='Facturation' description='Paiement et historique des transactions' />
      <div className='container mb-10 pt-10'>
        <h1 className='text-3xl font-semibold'>Facturation</h1>

        <Card className='mt-8' id='billing-payment-section'>
          <CardHeader>
            <CardTitle>Paiement</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div>
              <p className='mb-2 font-medium'>Type de renflouement</p>
              <RadioGroup
                value={selectedTarget ?? ''}
                onValueChange={(value) => {
                  const nextValue = getTargetFromQuery(value)
                  setSelectedTarget(nextValue)
                  setErrors((prev) => ({ ...prev, target: undefined }))
                }}
                className='flex flex-col gap-3 sm:flex-row'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='membership' id='membership' />
                  <Label htmlFor='membership'>Membership</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='rpn' id='rpn' />
                  <Label htmlFor='rpn'>Fonds RPN</Label>
                </div>
              </RadioGroup>
              {errors.target ? (
                <p className='mt-1 text-sm text-destructive'>{errors.target}</p>
              ) : null}
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='amountInterac'>Montant a payer</Label>
                <Input
                  id='amountInterac'
                  type='number'
                  min={0}
                  value={amountInterac}
                  onChange={(event) =>
                    setAmountInterac(Number(event.target.value || 0))
                  }
                />
                {errors.amountInterac ? (
                  <p className='mt-1 text-sm text-destructive'>
                    {errors.amountInterac}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor='refInterac'>
                  Code interactif fourni par la banque
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

            <Button onClick={onSubmit} disabled={isSubmitting}>
              Valider Paiement
            </Button>

            {confirmationMessage ? (
              <Alert>
                <AlertTitle>Confirmation</AlertTitle>
                <AlertDescription>{confirmationMessage}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className='mt-10 grid gap-6 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Historique Membership (annee courante)</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable
                transactions={membershipTransactions}
                emptyMessage='Aucune transaction Membership pour cette annee.'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique Fonds RPN (5 dernieres recharges)</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable
                transactions={rpnTopUps}
                emptyMessage='Aucune recharge RPN trouvee.'
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
        <div
          key={transaction._id}
          className='rounded border p-3 text-sm'
        >
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
