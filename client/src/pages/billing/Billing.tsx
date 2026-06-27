import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { MemberServiceCard } from '@/components/billing/MemberServiceCard'
import { InteracPaymentSection } from '@/components/billing/InteracPaymentSection'
import type { InteracPaymentSectionErrors } from '@/components/billing/InteracPaymentSection'
import {
  useGetTransactionsByUserIdQuery,
  useNewTransactionMutation,
} from '@/hooks/transactionHooks'
import { useFullBillingMembers } from '@/hooks/useFullBillingMembers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import {
  buildTopUpReason,
  getMembershipCurrentYearTransactions,
  getRpnCurrentYearTransactions,
  getTransactionAmountByFund,
  getTransactionStatusLabel,
  type FundAmountContext,
} from '@/lib/billing'
import { getTransactionStatusBadgeClass } from '@/lib/transactionStatus'
import { formatCurrency, functionReverse, toastAxiosError } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import type { Transaction } from '@/types'

type MemberSelection = { membership: boolean; rpn: boolean }

const Billing = () => {
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: transactions = [] } = useGetTransactionsByUserIdQuery(userId)
  const { mutateAsync: newTransaction, isPending: isSubmitting } = useNewTransactionMutation()

  const eligibleMembers = useFullBillingMembers()

  const initialSelections = useMemo(() => {
    const map: Record<string, MemberSelection> = {}
    for (const item of eligibleMembers) {
      map[item.memberId] = { membership: item.needsMembership, rpn: item.needsRpn }
    }
    return map
  }, [eligibleMembers])

  const [selections, setSelections] = useState<Record<string, MemberSelection>>(initialSelections)
  const [amountInterac, setAmountInterac] = useState('')
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<InteracPaymentSectionErrors>({})

  const handleMembershipToggle = (memberId: string, checked: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [memberId]: {
        membership: checked,
        rpn: checked ? (prev[memberId]?.rpn ?? false) : false,
      },
    }))
  }

  const handleRpnToggle = (memberId: string, checked: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], rpn: checked },
    }))
  }

  const { membershipTotal, rpnTotal, total, partialCoverage } = useMemo(() => {
    let membership = 0
    let rpn = 0
    // Only family members in partialCoverage — primary member covered by server automatically
    const coverage: { memberId: string; services: ('membership' | 'rpn')[] }[] = []

    for (const item of eligibleMembers) {
      const sel = selections[item.memberId]
      if (!sel) continue

      if (sel.membership && item.needsMembership) membership += item.membershipFee
      if (sel.rpn && item.needsRpn) rpn += item.rpnFee

      if (!item.isPrimary) {
        const services: ('membership' | 'rpn')[] = []
        if (sel.membership && item.needsMembership) services.push('membership')
        if (sel.rpn && item.needsRpn) services.push('rpn')
        if (services.length > 0) coverage.push({ memberId: item.memberId, services })
      }
    }

    return { membershipTotal: membership, rpnTotal: rpn, total: membership + rpn, partialCoverage: coverage }
  }, [eligibleMembers, selections])

  const membershipTransactions = useMemo(() => getMembershipCurrentYearTransactions(transactions), [transactions])
  const rpnTransactions = useMemo(() => getRpnCurrentYearTransactions(transactions), [transactions])
  const amountContext: FundAmountContext = { membershipDueAmount: membershipTotal, rpnDueAmount: rpnTotal }

  const onSubmit = async () => {
    if (total === 0) {
      toast({ variant: 'destructive', title: 'Aucun service sélectionné', description: 'Veuillez cocher au moins un service.' })
      return
    }

    const schema = createInteracFormSchema(total)
    const validation = schema.safeParse({ amountInterac, refInterac })

    if (!validation.success) {
      const nextErrors: InteracPaymentSectionErrors = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'amountInterac') nextErrors.amountInterac = issue.message
        if (issue.path[0] === 'refInterac') nextErrors.refInterac = issue.message
      }
      setErrors(nextErrors)
      return
    }

    try {
      setErrors({})
      const fundType = membershipTotal > 0 && rpnTotal > 0 ? 'both'
        : membershipTotal > 0 ? 'membership' : 'rpn'

      // hasFamilyMembers: at least one non-primary member was shown in the list
      const hasFamilyMembers = eligibleMembers.some((m) => !m.isPrimary)
      // Always send explicit partialCoverage when family members exist in the list,
      // so the server knows exactly who to cover (empty array = cover nobody in family)
      const coveragePayload = hasFamilyMembers ? partialCoverage : undefined

      await newTransaction({
        userId,
        amount: total,
        type: 'credit',
        fundType,
        membershipAmount: membershipTotal,
        rpnAmount: rpnTotal,
        reason: buildTopUpReason(fundType),
        refInterac: validation.data.refInterac,
        status: 'pending',
        partialCoverage: coveragePayload,
      } as any)

      await queryClient.invalidateQueries({ queryKey: ['accountsByUserId', userId] })
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })

      setRefInterac('')
      setAmountInterac('')
      toast({ variant: 'success', title: 'Paiement enregistré', description: 'Merci ! Votre paiement sera vérifié dans les prochains jours.' })
      navigate('/summary?payment=submitted', { replace: true })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <>
      <SearchEngineOptimization title='Facturation' description='Paiement et historique des transactions' />
      <div className='container mb-10 pt-10'>
        <h1 className='text-3xl font-semibold'>Facturation</h1>

        {eligibleMembers.length === 0 ? (
          <Card className='mt-8'>
            <CardContent className='pt-6 flex flex-col items-center gap-4 text-center'>
              <CheckCircle2 className='h-10 w-10 text-green-500' />
              <p className='text-lg font-medium'>Aucun paiement disponible</p>
              <p className='text-sm text-muted-foreground'>
                Votre membership est à jour et le RPN n'est pas actif sur votre compte.
              </p>
              <Button asChild variant='outline'>
                <Link to='/profil/couverture'>Voir ma couverture</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-8' id='billing-payment-section'>
            <CardHeader>
              <CardTitle>Sélection des services</CardTitle>
              <CardDescription>
                Choisissez les services à payer pour chaque membre selon votre budget.
                Pour ajouter des personnes à charge :{' '}
                <Button asChild variant='link' className='h-auto p-0 text-xs'>
                  <Link to='/profil/dependents'>Personnes à charge</Link>
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {eligibleMembers.map((item) => {
                const sel = selections[item.memberId] ?? { membership: false, rpn: false }
                const rpnDisabled = item.needsMembership && !sel.membership
                return (
                  <MemberServiceCard
                    key={item.memberId}
                    memberId={item.memberId}
                    name={item.name}
                    relationship={item.relationship}
                    needsMembership={item.needsMembership}
                    needsRpn={item.needsRpn}
                    membershipFee={item.membershipFee}
                    rpnFee={item.rpnFee}
                    membershipLocked={item.membershipLocked}
                    selMembership={sel.membership}
                    selRpn={sel.rpn}
                    rpnDisabled={rpnDisabled}
                    onMembershipChange={(checked) => handleMembershipToggle(item.memberId, checked)}
                    onRpnChange={(checked) => handleRpnToggle(item.memberId, checked)}
                  />
                )
              })}
            </CardContent>
          </Card>
        )}

        {eligibleMembers.length > 0 && (
          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>Récapitulatif & paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <InteracPaymentSection
                membershipTotal={membershipTotal}
                rpnTotal={rpnTotal}
                total={total}
                amountInterac={amountInterac}
                refInterac={refInterac}
                errors={errors}
                isSubmitting={isSubmitting}
                onAmountChange={setAmountInterac}
                onRefChange={setRefInterac}
                onSubmit={onSubmit}
              />
            </CardContent>
          </Card>
        )}

        <div className='mt-10 grid gap-6 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Historique Membership</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable
                transactions={membershipTransactions}
                fund='membership'
                amountContext={amountContext}
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
                amountContext={amountContext}
                emptyMessage='Aucune transaction RPN pour cette année.'
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
            <Badge className={getTransactionStatusBadgeClass(transaction.status)}>
              {getTransactionStatusLabel(transaction.status)}
            </Badge>
          </div>
          <p className='mt-1'>
            Montant:{' '}
            <strong>
              {formatCurrency(getTransactionAmountByFund(transaction, fund, amountContext))}
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
