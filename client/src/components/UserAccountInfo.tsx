import { useContext, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Store } from '@/lib/Store'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import { ToLocaleStringFunc } from '@/lib/utils'
import { Button } from './ui/button'
import { buildPaymentMessage, computeFamilyFeesSummary } from '@/lib/familyFees'
import { buildBillingPaymentUrl } from '@/lib/billing'
import { useNavigate } from 'react-router-dom'

const UserAccountInfo = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''
  const { data: account } = useGetAccountsByUserIdQuery(userId)
  const navigate = useNavigate()

  const [membershipBalance, setMembershipBalance] = useState<number>(0)
  const [rpnBalance, setRpnBalance] = useState<number>(0)

  const subscriptionStatus = userInfo?.subscription?.status

  const membershipStatusLabel = useMemo(() => {
    if (subscriptionStatus === 'active') return 'A jour'
    if (subscriptionStatus === 'registered') return 'En retard'
    return 'Renouvellement bientot'
  }, [subscriptionStatus])

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

  useEffect(() => {
    if (account?.[0]) {
      const nextMembership = account[0].membership_balance ?? account[0].solde ?? 0
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
          <CardDescription>{membershipStatusLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='text-2xl font-bold'>
              $&nbsp;{ToLocaleStringFunc(membershipBalance)}
            </div>
            <Button
              onClick={() => navigate(buildBillingPaymentUrl('membership'))}
              variant='outline'
              size='sm'
              className='ml-4 border-primary text-primary text-xs'
            >
              Renflouer
            </Button>
          </div>
          <div className='mt-3 text-sm leading-relaxed text-muted-foreground'>
            <p className='inline-block rounded bg-yellow-200 px-2 py-1 font-medium text-yellow-900'>
              {membershipPaymentMessage}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fonds RPN</CardTitle>
          <CardDescription>Contribution volontaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='text-2xl font-bold'>
              $&nbsp;{ToLocaleStringFunc(rpnBalance)}
            </div>
            <Button
              onClick={() => navigate(buildBillingPaymentUrl('rpn'))}
              variant='outline'
              size='sm'
              className='ml-4 border-primary text-primary text-xs'
            >
              Renflouer
            </Button>
          </div>
          <div className='mt-3 text-sm leading-relaxed text-muted-foreground'>
            <p className='inline-block rounded bg-yellow-200 px-2 py-1 font-medium text-yellow-900'>
              {rpnPaymentMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserAccountInfo
