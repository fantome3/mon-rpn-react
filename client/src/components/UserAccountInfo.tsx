import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ToLocaleStringFunc } from '@/lib/utils'
import { Button } from './ui/button'
import { buildPaymentMessage, computeFamilyFeesSummary } from '@/lib/familyFees'
import {
  buildBillingPaymentUrl,
  canPrimaryMemberTopUpRpn,
  formatNextMembershipDueDate,
  getMembershipPaymentBadgeClass,
  getMembershipPaymentBadgeLabel,
  getMembershipPaymentUiState,
  resolveEffectiveRpnStatus,
  RPN_PAYMENT_BLOCK_MESSAGE,
  shouldResetMembershipDisplayForCurrentYear,
} from '@/lib/billing'
import type { RpnStatus } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'
import { Badge } from './ui/badge'
import { CircleCheckBig } from 'lucide-react'
import { toast } from './ui/use-toast'

const RPN_STATUS_CONFIG: Record<RpnStatus, { label: string; className: string }> = {
  not_enrolled: { label: 'Non inscrit', className: 'bg-gray-100 text-gray-700' },
  pending:      { label: 'En probation', className: 'bg-yellow-100 text-yellow-800' },
  enrolled:     { label: 'Inscrit', className: 'bg-green-100 text-green-800' },
  unsubscribed: { label: 'Desinscrit', className: 'bg-red-100 text-red-800' },
}

const UserAccountInfo = () => {
  const { user: userInfo, userId } = useCurrentUser()
  const { data: account } = useGetAccountsByUserIdQuery(userId)
  const { data: transactions = [] } = useGetTransactionsByUserIdQuery(userId)
  const navigate = useNavigate()

  const [membershipBalance, setMembershipBalance] = useState<number>(0)
  const [rpnBalance, setRpnBalance] = useState<number>(0)

  const familyFeesSummary = useMemo(
    () => computeFamilyFeesSummary(userInfo),
    [userInfo]
  )
  const membershipPaymentMessage = useMemo(
    () =>
      buildPaymentMessage(
        familyFeesSummary.membershipAmount,
        familyFeesSummary.dependantCount
      ),
    [familyFeesSummary]
  )
  const rpnPaymentMessage = useMemo(
    () =>
      buildPaymentMessage(
        familyFeesSummary.rpnAmount,
        familyFeesSummary.dependantCount
      ),
    [familyFeesSummary]
  )
  const membershipPaymentState = useMemo(
    () => getMembershipPaymentUiState(transactions, new Date().getFullYear(), userInfo?.subscription),
    [transactions, userInfo?.subscription]
  )
  const canPayRpn = useMemo(
    () =>
      canPrimaryMemberTopUpRpn({
        isPrimaryMember: userInfo?.primaryMember,
        transactions,
        subscription: userInfo?.subscription,
      }),
    [transactions, userInfo?.primaryMember, userInfo?.subscription]
  )

  const rpnStatus = useMemo(
    () => resolveEffectiveRpnStatus(userInfo?.subscription, rpnBalance),
    [userInfo?.subscription, rpnBalance]
  )
  const membershipBadgeLabel = useMemo(
    () => getMembershipPaymentBadgeLabel(membershipPaymentState),
    [membershipPaymentState]
  )
  const membershipBadgeClass = useMemo(
    () => getMembershipPaymentBadgeClass(membershipPaymentState),
    [membershipPaymentState]
  )
  const nextMembershipDueDate = useMemo(
    () => formatNextMembershipDueDate(userInfo?.subscription?.endDate),
    [userInfo?.subscription?.endDate]
  )
  const shouldResetMembershipDisplay = useMemo(
    () => shouldResetMembershipDisplayForCurrentYear(userInfo?.subscription, new Date().getFullYear()),
    [userInfo?.subscription]
  )
  const displayedMembershipBalance = useMemo(() => {
    if (membershipPaymentState === 'success') return null
    if (shouldResetMembershipDisplay) return 0
    return membershipBalance
  }, [membershipBalance, membershipPaymentState, shouldResetMembershipDisplay])

  useEffect(() => {
    if (account?.[0]) {
      const nextMembership = account[0].membership_balance ?? 0
      const nextRpn = account[0].rpn_balance ?? 0
      setMembershipBalance(nextMembership)
      setRpnBalance(nextRpn)
    }
  }, [account])

  return (
    <div className='col-span-1 sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-10'>
      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
          <CardDescription>
            {
              membershipPaymentState === 'success' ? (
                <p className='mt-2 text-xs text-muted-foreground'>
                  Prochaine cotisation prevue le : {nextMembershipDueDate}
                </p>
              ) : <p className='inline-block rounded bg-yellow-200 px-2 py-1 font-medium text-yellow-900'>
                    {membershipPaymentMessage}
                  </p>
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            {membershipPaymentState === 'success' ? (
              <div className='flex items-center gap-2'>
                <Badge className={`${membershipBadgeClass} px-3 py-1 text-sm font-semibold`}>
                  {membershipBadgeLabel}
                </Badge>
                <CircleCheckBig className='h-6 w-6 text-green-600' />
              </div>
            ) : (
              <div className='text-2xl font-bold'>
                $&nbsp;{ToLocaleStringFunc(displayedMembershipBalance ?? 0)}
              </div>
            )}
            <div className='ml-4 flex items-center gap-2'>
              {membershipPaymentState !== 'success' ? (
                <Badge className={membershipBadgeClass}>{membershipBadgeLabel}</Badge>
              ) : null}
              {membershipPaymentState !== 'success' ? (
                <Button
                  onClick={() => navigate(buildBillingPaymentUrl('membership'))}
                  variant='outline'
                  size='sm'
                  disabled={membershipPaymentState === 'pending'}
                  className={
                    membershipPaymentState === 'pending'
                      ? 'border-yellow-500 bg-yellow-100 text-yellow-900 text-xs'
                      : 'border-primary text-primary text-xs'
                  }
                >
                  Renflouer
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Fonds RPN</CardTitle>
            <Badge className={`${RPN_STATUS_CONFIG[rpnStatus].className} px-2 py-1 text-xs font-semibold`}>
              {RPN_STATUS_CONFIG[rpnStatus].label}
            </Badge>
          </div>
          <CardDescription>
            <p className='inline-block rounded bg-yellow-200 px-2 py-1 font-medium text-yellow-900'>
              {rpnPaymentMessage}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='text-2xl font-bold'>
              $&nbsp;{ToLocaleStringFunc(rpnBalance)}
            </div>
            <Button
              onClick={() => {
                if (!canPayRpn) {
                  toast({
                    variant: 'destructive',
                    title: 'Paiement RPN bloqué',
                    description: RPN_PAYMENT_BLOCK_MESSAGE,
                  })
                  return
                }
                navigate(buildBillingPaymentUrl('rpn'))
              }}
              variant='outline'
              size='sm'
              className='ml-4 border-primary text-primary text-xs'
            >
              Renflouer
            </Button>
          </div>
          {!canPayRpn ? (
            <p className='mt-3 text-xs text-destructive'>
              Le fonds RPN est disponible apres validation du membership annuel.
            </p>
          ) : null}
          {rpnStatus === 'unsubscribed' ? (
            <p className='mt-3 text-xs text-destructive'>
              Votre solde était insuffisant après plusieurs rappels. Renflouez votre fonds RPN
              pour être automatiquement réinscrit.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserAccountInfo
